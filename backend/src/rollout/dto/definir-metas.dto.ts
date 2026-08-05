import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MetaDto {
  @IsDateString()
  data: string;

  @IsInt()
  @Min(0)
  quantidadeAcumulada: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  descricao?: string;
}

export class DefinirMetasDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MetaDto)
  metas: MetaDto[];
}
