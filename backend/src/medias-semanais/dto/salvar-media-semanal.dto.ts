import { IsDateString, IsInt, Min } from 'class-validator';

export class SalvarMediaSemanalDto {
  /** Dia inicial da semana; identifica o lançamento. */
  @IsDateString()
  semana: string;

  @IsInt()
  @Min(0)
  mediaOperacoes: number;
}
