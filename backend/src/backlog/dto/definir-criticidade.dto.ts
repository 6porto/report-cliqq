import { IsIn, IsOptional } from 'class-validator';
import {
  CRITICIDADES,
  ESFORCO_INDEFINIDO,
  PONTOS_DE_ESFORCO,
  type Criticidade,
} from '../../comum/priorizacao';

/** O zero é o esforço que ainda não dá para estimar; vira `esforco::?`. */
const PONTOS_ACEITOS = [...PONTOS_DE_ESFORCO, ESFORCO_INDEFINIDO.pontos];

export class DefinirCriticidadeDto {
  @IsIn(CRITICIDADES)
  criticidade!: Criticidade;

  /**
   * Pontos da pergunta de esforço; viram o label `esforco::` em dias corridos.
   * Ausente quando a criticidade foi definida sem responder as perguntas.
   */
  @IsOptional()
  @IsIn(PONTOS_ACEITOS)
  esforco?: number;
}
