import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

// Module global : Redis (cache) et Prometheus (metrics) sont utilisables
// depuis n'importe quel module sans avoir a les reimporter partout.
@Global()
@Module({
  providers: [RedisService, MetricsService],
  controllers: [MetricsController],
  exports: [RedisService, MetricsService],
})
export class CommonModule {}
