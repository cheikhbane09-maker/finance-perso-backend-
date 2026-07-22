import { Injectable, Logger } from '@nestjs/common';

// Integration API externe gratuite : ExchangeRate (open.er-api.com, sans cle API)
// Utilisee pour convertir le montant epargne (FCFA/XOF) vers d'autres devises.
@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly BASE_URL = 'https://open.er-api.com/v6/latest/XOF';
  private readonly CACHE_DUREE_MS = 60 * 60 * 1000; // 1 heure

  private tauxCache: Record<string, number> | null = null;
  private derniereRecuperation = 0;

  private async getTaux(): Promise<Record<string, number>> {
    const maintenant = Date.now();

    if (this.tauxCache && maintenant - this.derniereRecuperation < this.CACHE_DUREE_MS) {
      return this.tauxCache;
    }

    try {
      const reponse = await fetch(this.BASE_URL);
      const data = (await reponse.json()) as { rates?: Record<string, number> };

      if (!data.rates) {
        throw new Error('Reponse invalide de l\'API ExchangeRate');
      }

      this.tauxCache = data.rates;
      this.derniereRecuperation = maintenant;
      return this.tauxCache;
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
