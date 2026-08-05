import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CriarFilialDto } from './criar-filial.dto';

export class ImportarFiliaisDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => CriarFilialDto)
  filiais: CriarFilialDto[];
}
