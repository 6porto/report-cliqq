import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { STATUS_ROLLOUT, StatusRollout } from '../../comum/status-rollout';

export class AtualizarStatusDto {
  @IsIn(STATUS_ROLLOUT)
  status: StatusRollout;

  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  autor?: string;
}
