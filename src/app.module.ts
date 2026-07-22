import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { EpargneModule } from './modules/epargne/epargne.module';

import { User } from './modules/users/user.entity';
import { Transaction } from './modules/transactions/transaction.entity';
import { Epargne } from './modules/epargne/epargne.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH || 'db.sqlite',
      entities: [User, Transaction, Epargne],
      synchronize: true, // OK pour un projet pedagogique (a eviter en production)
    }),
    UsersModule,
    AuthModule,
    TransactionsModule,
    EpargneModule,
  ],
})
export class AppModule {}
