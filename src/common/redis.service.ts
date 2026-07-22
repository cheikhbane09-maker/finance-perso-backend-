import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

// Wrapper autour de Redis (bonus : "Integration de Redis").
// Si REDIS_URL n'est pas configure ou si Redis est injoignable, le service
// se met simplement en mode "indisponible" : les appelants (ex: ExchangeRateService)
// doivent alors retomber sur un cache en memoire local. L'application ne plante jamais
// a cause de Redis.
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private disponible = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL non defini : cache Redis desactive (repli sur cache memoire).');
      return;
    }

    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // pas de retry infini si Redis est down
    });

    this.client.on('error', (err) => {
      this.disponible = false;
      this.logger.warn(`Redis indisponible (${err.message}) : repli sur cache memoire.`);
    });

    this.client.on('ready', () => {
      this.disponible = true;
      this.logger.log('Connecte a Redis.');
    });

    this.client.connect().catch(() => {
      this.disponible = false;
    });
  }

  isDisponible(): boolean {
    return this.disponible;
  }

  async get(cle: string): Promise<string | null> {
    if (!this.disponible || !this.client) return null;
    try {
      return await this.client.get(cle);
    } catch {
      return null;
    }
  }

  async set(cle: string, valeur: string, ttlSecondes: number): Promise<void> {
    if (!this.disponible || !this.client) return;
    try {
      await this.client.set(cle, valeur, 'EX', ttlSecondes);
    } catch {
      // silencieux : le cache est un bonus, pas critique pour le fonctionnement
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
