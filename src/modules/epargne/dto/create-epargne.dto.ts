import { IsDateString, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateEpargneDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @IsNumber()
  @IsPositive({ message: 'Le montant doit etre positif' })
  montant: number;

  @IsDateString({}, { message: 'dateDeblocage doit etre une date valide (ISO)' })
  dateDeblocage: string;
}
