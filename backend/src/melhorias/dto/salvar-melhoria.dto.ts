import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SalvarMelhoriaDto {
  /** Ausente ao cadastrar; informado ao corrigir uma melhoria já gravada. */
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descricao: string;

  /** Dia previsto para subir; nulo enquanto não há data definida. */
  @IsOptional()
  @IsDateString()
  dataPrevista?: string | null;

  @IsOptional()
  @IsBoolean()
  subiuEmProducao?: boolean;
}
