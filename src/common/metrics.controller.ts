import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

// Endpoint scrape par Prometheus (voir prometheus.yml)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  metrics() {
    return this.metricsService.metriquesAuFormatPrometheus();
  }
}
