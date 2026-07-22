import { IsEnum, IsNumber, IsPositive, IsString, MinLength } from 'class-validator';
import { TransactionType } from '../transaction-type.enum';

export class CreateTransactionDto {
  @IsEnum(TransactionType, { message: 'Le type doit etre "revenu" ou "depense"' })
  type: TransactionType;

  @IsString()
  @MinLength(1)
  nom: string;

  @IsNumber()
  @IsPositive({ message: 'Le montant doit etre positif' })
  montant: number;
}
