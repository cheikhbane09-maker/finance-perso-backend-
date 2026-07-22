import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

// Bonus "Monitoring avec Prometheus et Grafana".
// Expose les metriques par defaut de Node.js (CPU, memoire, event loop...)
// ainsi qu'un compteur personnalise du nombre de requetes HTTP traitees.
@Injectable()
export class MetricsService {
  readonly registre: client.Registry;
  private readonly compteurRequetes: client.Counter<string>;

  constructor() {
    this.registre = new client.Registry();
    client.collectDefaultMetrics({ register: this.registre });

    this.compteurRequetes = new client.Counter({
      name: 'finance_perso_http_requests_total',
      help: 'Nombre total de requetes HTTP traitees par le backend',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registre],
    });
  }

  enregistrerRequete(method: string, route: string, status: number) {
    this.compteurRequetes.inc({ method, route, status: String(status) });
  }

  async metriquesAuFormatPrometheus(): Promise<string> {
    return this.registre.metrics();
  }
}
