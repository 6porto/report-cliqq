import { IsIn, IsOptional } from 'class-validator';
import { PONTOS_POSSIVEIS } from '../../comum/priorizacao';

export class SalvarRespostaDto {
  @IsOptional()
  @IsIn(PONTOS_POSSIVEIS)
  beneficiados?: number;

  @IsOptional()
  @IsIn(PONTOS_POSSIVEIS)
  tipoDeGanho?: number;

  @IsOptional()
  @IsIn(PONTOS_POSSIVEIS)
  frequencia?: number;

  @IsOptional()
  @IsIn(PONTOS_POSSIVEIS)
  riscoDeAdiar?: number;

  @IsOptional()
  @IsIn(PONTOS_POSSIVEIS)
  esforco?: number;
}
