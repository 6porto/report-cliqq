import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { STATUS_ROLLOUT, StatusRollout } from '../../comum/status-rollout';

export class CriarFilialDto {
  @IsString()
  @MaxLength(20)
  codigo: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  uf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  regional?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  onda?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  mediaOperacoes90Dias?: number;

  @IsOptional()
  @IsIn(STATUS_ROLLOUT)
  status?: StatusRollout;

  @IsOptional()
  @IsDateString()
  dataPrevista?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataConclusao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
