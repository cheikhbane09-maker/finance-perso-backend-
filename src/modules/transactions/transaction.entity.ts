import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionType } from './transaction-type.enum';
import { User } from '../users/user.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  type: TransactionType; // 'revenu' ou 'depense'

  @Column()
  nom: string;

  @Column('float')
  montant: number;

  @CreateDateColumn()
  date: Date;

  // La cle etrangere (userId) est stockee dans la table Transaction,
  // conformement au modele Category/Product vu en cours (ManyToOne cote "enfant").
  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
