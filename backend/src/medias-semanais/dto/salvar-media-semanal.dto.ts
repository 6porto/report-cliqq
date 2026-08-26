import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SalvarMediaSemanalDto {
  /** Dia inicial da semana; identifica o lançamento. */
  @IsDateString()
  semana: string;

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

  /** Bugs ainda em aberto ao fim da semana, por criticidade. */
  @IsOptional()
  @IsInt()
  @Min(0)
  bugsAlta?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  bugsMedia?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  bugsBaixa?: number | null;

  /** Anotação livre sobre os bugs da semana. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bugsDescricao?: string | null;
}
