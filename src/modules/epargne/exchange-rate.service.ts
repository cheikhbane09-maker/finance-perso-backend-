import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis.service';

// Integration API externe gratuite : ExchangeRate (open.er-api.com, sans cle API)
// Utilisee pour convertir le montant epargne (FCFA/XOF) vers d'autres devises.
//
// Bonus "Integration de Redis" : les taux sont mis en cache dans Redis (partage entre
// plusieurs instances du backend). Si Redis n'est pas disponible, on retombe
// automatiquement sur un cache en memoire local, donc le service marche dans tous les cas.
@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly BASE_URL = 'https://open.er-api.com/v6/latest/XOF';
  private readonly CACHE_DUREE_SECONDES = 60 * 60; // 1 heure
  private readonly REDIS_CLE = 'finance-perso:taux-de-change';

  private tauxCacheMemoire: Record<string, number> | null = null;
  private derniereRecuperation = 0;

  constructor(private readonly redisService: RedisService) {}

  private async getTaux(): Promise<Record<string, number>> {
    const maintenant = Date.now();

    // 1) Cache memoire local (le plus rapide)
    if (
      this.tauxCacheMemoire &&
      maintenant - this.derniereRecuperation < this.CACHE_DUREE_SECONDES * 1000
    ) {
      return this.tauxCacheMemoire;
    }

    // 2) Cache Redis (partage entre plusieurs instances du backend)
    const valeurRedis = await this.redisService.get(this.REDIS_CLE);
    if (valeurRedis) {
      const taux = JSON.parse(valeurRedis);
      this.tauxCacheMemoire = taux;
      this.derniereRecuperation = maintenant;
      return taux;
    }

    // 3) Sinon, appel de l'API externe
    try {
      const reponse = await fetch(this.BASE_URL);
      const data = (await reponse.json()) as { rates?: Record<string, number> };

      if (!data.rates) {
        throw new Error('Reponse invalide de l\'API ExchangeRate');
      }

      this.tauxCacheMemoire = data.rates;
      this.derniereRecuperation = maintenant;

      // Alimente le cache Redis pour les prochaines requetes / autres instances
      await this.redisService.set(
        this.REDIS_CLE,
        JSON.stringify(data.rates),
        this.CACHE_DUREE_SECONDES,
      );

      return this.tauxCacheMemoire;
    } catch (erreur) {
      this.logger.warn(`Impossible de recuperer les taux de change : ${erreur.message}`);
      // Taux de secours approximatifs si l'API externe est indisponible
      return { USD: 0.0016, EUR: 0.0015, XOF: 1 };
    }
  }

  async convertir(montantXof: number, devise: string): Promise<number | null> {
    const taux = await this.getTaux();
    const tauxDevise = taux[devise.toUpperCase()];
    if (!tauxDevise) return null;
    return Math.round(montantXof * tauxDevise * 100) / 100;
  }

  async tauxDisponibles(): Promise<Record<string, number>> {
    return this.getTaux();
  }
}
