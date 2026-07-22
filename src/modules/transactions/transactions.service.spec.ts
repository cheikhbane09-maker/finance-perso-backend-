import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { TransactionType } from './transaction-type.enum';
import { Role } from '../users/role.enum';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(Transaction), useValue: repo },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('cree une transaction rattachee a l\'utilisateur connecte', async () => {
    const resultat = await service.create(42, {
      type: TransactionType.REVENU,
      nom: 'Salaire',
      montant: 1000,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42, nom: 'Salaire' }),
    );
    expect(resultat.userId).toBe(42);
  });

  it("liste uniquement les transactions de l'utilisateur connecte", async () => {
    await service.findAllForUser(42, TransactionType.DEPENSE);

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 42, type: TransactionType.DEPENSE } }),
    );
  });

  it('refuse la suppression si la transaction appartient a un autre utilisateur', async () => {
    repo.findOne.mockResolvedValue({ id: 1, userId: 99 });

    await expect(service.remove(1, 42, Role.USER)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("autorise la suppression par un admin, meme si ce n'est pas le proprietaire", async () => {
    repo.findOne.mockResolvedValue({ id: 1, userId: 99 });
    repo.remove.mockResolvedValue(undefined);

    await expect(service.remove(1, 42, Role.ADMIN)).resolves.toEqual({
      message: 'Transaction supprimee.',
    });
  });

  it('leve une erreur 404 si la transaction est introuvable', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.remove(999, 42, Role.USER)).rejects.toBeInstanceOf(NotFoundException);
  });
});
