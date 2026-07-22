import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Epargne } from './epargne.entity';
import { EpargneService } from './epargne.service';
import { EpargneController } from './epargne.controller';
import { ExchangeRateService } from './exchange-rate.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Epargne]), AuthModule],
  providers: [EpargneService, ExchangeRateService],
  controllers: [EpargneController],
})
export class EpargneModule {}
