import { IsIn, IsOptional } from 'class-validator';
import { PERIODOS_EM_DIAS } from '../../comum/backlog-gitlab';

export class FiltroBacklogDto {
  /** Dias para trás; ausente significa o backlog inteiro. */
  @IsOptional()
  @IsIn([...PERIODOS_EM_DIAS], { message: `dias deve ser ${PERIODOS_EM_DIAS.join(', ')} ou vazio` })
  dias?: number;
}
