import { IsIn, IsOptional } from 'class-validator';
import { PONTOS_DE_ESFORCO, PONTOS_DE_VALOR } from '../../comum/priorizacao';

export class SalvarRespostaDto {
  @IsOptional()
  @IsIn(PONTOS_DE_VALOR)
  beneficiados?: number;

  @IsOptional()
  @IsIn(PONTOS_DE_VALOR)
  tipoDeGanho?: number;

  @IsOptional()
  @IsIn(PONTOS_DE_VALOR)
  frequencia?: number;

  @IsOptional()
  @IsIn(PONTOS_DE_VALOR)
  riscoDeAdiar?: number;

  @IsOptional()
  @IsIn(PONTOS_DE_VALOR)
  contorno?: number;

  @IsOptional()
  @IsIn(PONTOS_DE_ESFORCO)
  esforco?: number;
}
