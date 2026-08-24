import { IsDateString, IsInt, Min } from 'class-validator';

export class SalvarLatenciaSemanalDto {
  /** Dia inicial da semana; identifica o lançamento. */
  @IsDateString()
  semana: string;

  /** Latência em milissegundos. */
  @IsInt()
  @Min(0)
  p50: number;

  @IsInt()
  @Min(0)
  p75: number;

  @IsInt()
  @Min(0)
  p95: number;

  @IsInt()
  @Min(0)
  p99: number;
}
