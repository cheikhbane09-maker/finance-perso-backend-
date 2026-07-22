import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.enum';
import { Transaction } from '../transactions/transaction.entity';
import { Epargne } from '../epargne/epargne.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // mot de passe hashe (bcrypt)

  @Column()
  nom: string;

  @Column({ type: 'varchar', default: Role.USER })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  // Un utilisateur peut avoir plusieurs transactions (revenus/depenses)
  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  // Un utilisateur peut avoir plusieurs comptes epargne bloques
  @OneToMany(() => Epargne, (epargne) => epargne.user)
  epargnes: Epargne[];
}
