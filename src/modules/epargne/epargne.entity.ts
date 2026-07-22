import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('epargnes')
export class Epargne {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column('float')
  montant: number;

  @CreateDateColumn()
  dateCreation: Date;

  @Column({ type: 'datetime' })
  dateDeblocage: Date; // date a partir de laquelle le retrait est autorise

  @ManyToOne(() => User, (user) => user.epargnes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
