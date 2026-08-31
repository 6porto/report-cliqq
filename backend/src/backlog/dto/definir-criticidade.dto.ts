import { IsIn, IsOptional } from 'class-validator';
import { CRITICIDADES, PONTOS_DE_ESFORCO, type Criticidade } from '../../comum/priorizacao';

export class DefinirCriticidadeDto {
  @IsIn(CRITICIDADES)
  criticidade!: Criticidade;

  /**
   * Pontos da pergunta de esforço; viram o label `esforco::` em dias corridos.
   * Ausente quando a criticidade foi definida sem responder as perguntas.
   */
  @IsOptional()
  @IsIn(PONTOS_DE_ESFORCO)
  esforco?: number;
}
