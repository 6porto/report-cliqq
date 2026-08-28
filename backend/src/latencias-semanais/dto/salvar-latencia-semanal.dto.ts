import { IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SalvarLatenciaSemanalDto {
  /** Dia inicial da semana; identifica o lançamento. */
  @IsDateString()
  semana: string;

  /** Distribuição do tempo de resposta na semana, em % das requisições. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentualAte1s?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentualAte3s?: number | null;

  /** Requisições com erro na semana, em % do total. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentualErros?: number | null;

  /** Quantas requisições passaram de 3 segundos na semana. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  requisicoesAcima3s?: number | null;
}
