import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EpargneService } from './epargne.service';
import { Epargne } from './epargne.entity';
import { ExchangeRateService } from './exchange-rate.service';
import { Role } from '../users/role.enum';

describe('EpargneService', () => {
  let service: EpargneService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn(() => Promise.resolve([])),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpargneService,
        { provide: getRepositoryToken(Epargne), useValue: repo },
        { provide: ExchangeRateService, useValue: { convertir: jest.fn(), tauxDisponibles: jest.fn() } },
      ],
    }).compile();

    service = module.get<EpargneService>(EpargneService);
  });

  it("refuse le retrait avant la date de deblocage", async () => {
    const demain = new Date(Date.now() + 24 * 60 * 60 * 1000);
    repo.findOne.mockResolvedValue({ id: 1, userId: 42, dateDeblocage: demain, montant: 5000 });

    await expect(service.remove(1, 42, Role.USER)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('autorise le retrait une fois la date de deblocage passee', async () => {
    const hier = new Date(Date.now() - 24 * 60 * 60 * 1000);
    repo.findOne.mockResolvedValue({ id: 1, userId: 42, dateDeblocage: hier, montant: 5000 });
    repo.remove.mockResolvedValue(undefined);

    const resultat = await service.remove(1, 42, Role.USER);

    expect(repo.remove).toHaveBeenCalled();
    expect(resultat.message).toBe('Retrait effectue avec succes.');
  });

  it("refuse l'acces a l'epargne d'un autre utilisateur (sauf admin)", async () => {
    const hier = new Date(Date.now() - 24 * 60 * 60 * 1000);
    repo.findOne.mockResolvedValue({ id: 1, userId: 99, dateDeblocage: hier, montant: 5000 });

    await expect(service.remove(1, 42, Role.USER)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('leve une erreur 404 si le compte epargne est introuvable', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.remove(999, 42, Role.USER)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cree un compte epargne rattache a l\'utilisateur connecte', async () => {
    const resultat = await service.create(42, {
      nom: 'Vacances',
      montant: 20000,
      dateDeblocage: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, nom: 'Vacances' }));
    expect(resultat.userId).toBe(42);
  });
});
