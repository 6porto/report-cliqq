import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GerarVersaoDto {
  /** Título da milestone; é também o nome da branch de onde a tag sai. */
  @IsString()
  @IsNotEmpty()
  milestone!: string;

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

  @IsString()
  mensagem!: string;
}
