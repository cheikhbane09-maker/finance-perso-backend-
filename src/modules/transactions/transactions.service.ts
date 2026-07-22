import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from './transaction-type.enum';
import { Role } from '../users/role.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  create(userId: number, dto: CreateTransactionDto) {
    const transaction = this.transactionsRepository.create({ ...dto, userId });
    return this.transactionsRepository.save(transaction);
  }

  // Transactions de l'utilisateur connecte, avec filtre optionnel par type
  findAllForUser(userId: number, type?: TransactionType) {
    return this.transactionsRepository.find({
      where: type ? { userId, type } : { userId },
      order: { date: 'DESC' },
    });
  }

  // Reserve aux admins (RBAC) : toutes les transactions, tous utilisateurs confondus
  findAllAdmin() {
    return this.transactionsRepository.find({
      relations: ['user'],
      order: { date: 'DESC' },
    });
  }

  async update(
    id: number,
    userId: number,
    role: Role,
    dto: UpdateTransactionDto,
  ) {
    const transaction = await this.findOwned(id, userId, role);
    Object.assign(transaction, dto);
    return this.transactionsRepository.save(transaction);
  }

  async remove(id: number, userId: number, role: Role) {
    const transaction = await this.findOwned(id, userId, role);
    await this.transactionsRepository.remove(transaction);
    return { message: 'Transaction supprimee.' };
  }

  private async findOwned(id: number, userId: number, role: Role) {
    const transaction = await this.transactionsRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new NotFoundException('Transaction introuvable.');
    }
    if (transaction.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException("Vous n'avez pas acces a cette transaction.");
    }
    return transaction;
  }
}
