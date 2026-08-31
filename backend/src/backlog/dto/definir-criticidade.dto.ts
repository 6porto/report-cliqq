import { IsIn } from 'class-validator';
import { CRITICIDADES, type Criticidade } from '../../comum/priorizacao';

export class DefinirCriticidadeDto {
  @IsIn(CRITICIDADES)
  criticidade!: Criticidade;
}
