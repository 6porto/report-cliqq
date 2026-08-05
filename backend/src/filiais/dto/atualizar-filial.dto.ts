import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CriarFilialDto } from './criar-filial.dto';

export class AtualizarFilialDto extends PartialType(
  OmitType(CriarFilialDto, ['status'] as const),
) {}
