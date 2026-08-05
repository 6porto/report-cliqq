import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { STATUS_ROLLOUT, StatusRollout } from '../../comum/status-rollout';

export const CAMPOS_ORDENAVEIS = [
  'codigo',
  'cidade',
  'uf',
  'onda',
  'mediaOperacoes90Dias',
  'status',
  'dataPrevista',
  'dataInicio',
  'dataConclusao',
] as const;

export type CampoOrdenavel = (typeof CAMPOS_ORDENAVEIS)[number];

export class FiltroFiliaisDto {
  @IsOptional()
  @IsIn(STATUS_ROLLOUT)
  status?: StatusRollout;

  @IsOptional()
  @IsString()
  regional?: string;

  @IsOptional()
  @IsString()
  uf?: string;

  @IsOptional()
  @IsString()
  onda?: string;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsIn(CAMPOS_ORDENAVEIS)
  ordenarPor?: CampoOrdenavel;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direcao?: 'asc' | 'desc';

  @IsOptional()
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  tamanho?: number = 50;
}
