import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class FiltroTagsDto {
  /** Caminho do projeto no GitLab; a regex barra qualquer coisa fora de `grupo/subgrupo/projeto`. */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\w[\w.-]*(?:\/\w[\w.-]*)+$/, {
    message: 'repositorio deve ser um caminho de projeto do GitLab',
  })
  repositorio!: string;
}
