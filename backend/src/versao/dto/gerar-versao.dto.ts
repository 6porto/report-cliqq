import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class RepositorioDaGeracaoDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\w[\w.-]*(?:\/\w[\w.-]*)+$/, {
    message: 'repositorio deve ser um caminho de projeto do GitLab',
  })
  repositorio!: string;

  @IsString()
  @Matches(/^v?_?\d+\.\d+\.\d+(?:-rc\d+)?$/i, {
    message: 'tag deve seguir o padrão v_X.Y.Z-rcN',
  })
  tag!: string;

  /** iids das issues que entram na versão deste repositório. */
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  issues!: number[];
}

export class GerarVersaoDto {
  /** Título da milestone; é também o nome da branch de onde as tags saem. */
  @IsString()
  @IsNotEmpty()
  milestone!: string;

  /** Um ou mais repositórios liberados na mesma leva. */
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RepositorioDaGeracaoDto)
  repositorios!: RepositorioDaGeracaoDto[];
}
