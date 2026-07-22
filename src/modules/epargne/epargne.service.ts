import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epargne } from './epargne.entity';
import { CreateEpargneDto } from './dto/create-epargne.dto';
import { ExchangeRateService } from './exchange-rate.service';
import { Role } from '../users/role.enum';

@Injectable()
export class EpargneService {
  constructor(
    @InjectRepository(Epargne)
    private readonly epargneRepository: Repository<Epargne>,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  create(userId: number, dto: CreateEpargneDto) {
    const epargne = this.epargneRepository.create({
      nom: dto.nom,
      montant: dto.montant,
      dateDeblocage: new Date(dto.dateDeblocage),
      userId,
    });
    return this.epargneRepository.save(epargne);
  }

  async findAllForUser(userId: number, devise?: string) {
    const epargnes = await this.epargneRepository.find({
      where: { userId },
      order: { dateCreation: 'DESC' },
    });

    return Promise.all(
      epargnes.map(async (epargne) => ({
        ...epargne,
        debloque: this.estDebloque(epargne),
        montantConverti: devise
          ? await this.exchangeRateService.convertir(epargne.montant, devise)
          : undefined,
      })),
    );
  }

  tauxDeChange() {
    return this.exchangeRateService.tauxDisponibles();
  }

  async remove(id: number, userId: number, role: Role) {
    const epargne = await this.epargneRepository.findOne({ where: { id } });
    if (!epargne) {
      throw new NotFoundException('Compte epargne introuvable.');
    }
    if (epargne.userId !== userId && role !== Role.ADMIN) {
      throw new ForbiddenException("Vous n'avez pas acces a ce compte epargne.");
    }
    if (!this.estDebloque(epargne)) {
      throw new ForbiddenException(
        `Ce compte est bloque jusqu'au ${epargne.dateDeblocage.toLocaleDateString('fr-FR')}. Retrait impossible avant cette date.`,
      );
    }

    await this.epargneRepository.remove(epargne);
    return { message: 'Retrait effectue avec succes.' };
  }

  private estDebloque(epargne: Epargne): boolean {
    return new Date(epargne.dateDeblocage).getTime() <= Date.now();
  }
}
