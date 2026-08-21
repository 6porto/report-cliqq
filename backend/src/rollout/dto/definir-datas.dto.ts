import { IsObject } from 'class-validator';
import { StatusRollout } from '../../comum/status-rollout';

/**
 * Uma data por status: `null` apaga a data, chave ausente deixa como está.
 * As chaves são validadas em `RolloutService.definirDatas`.
 */
export class DefinirDatasDto {
  @IsObject()
  datas: Partial<Record<StatusRollout, string | null>>;
}
