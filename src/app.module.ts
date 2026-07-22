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
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const entities = [User, Transaction, Epargne];

        // DB_TYPE=mysql -> utilise MySQL (ex: via XAMPP)
        // DB_TYPE absent ou "sqlite" -> utilise un simple fichier SQLite (aucune installation requise)
        if (process.env.DB_TYPE === 'mysql') {
          return {
            type: 'mysql' as const,
            host: process.env.DB_HOST || '127.0.0.1',
            port: Number(process.env.DB_PORT) || 3306,
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'finance_perso',
            entities,
            synchronize: true, // OK pour un projet pedagogique (a eviter en production)
          };
        }

        return {
          type: 'sqlite' as const,
          database: process.env.DB_PATH || 'db.sqlite',
          entities,
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    TransactionsModule,
    EpargneModule,
  ],
})
export class AppModule {}
