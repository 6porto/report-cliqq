import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class SalvarMediaSemanalDto {
  /** Dia inicial da semana; identifica o lançamento. */
  @IsDateString()
  semana: string;

  @IsInt()
  @Min(0)
  mediaOperacoes: number;

  /** Operações da semana em cada sistema; ausente enquanto não apuradas. */
  @IsOptional()
  @IsInt()
  @Min(0)
  operacoesLegado?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  operacoesCentralizado?: number | null;

  /** Operações que ficaram no legado apenas nas lojas do piloto. */
  @IsOptional()
  @IsInt()
  @Min(0)
  pedidosLegadoPiloto?: number | null;
}
