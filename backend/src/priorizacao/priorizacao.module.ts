import { Module } from '@nestjs/common';
import { PriorizacaoController } from './priorizacao.controller';
import { PriorizacaoService } from './priorizacao.service';

@Module({
  controllers: [PriorizacaoController],
  providers: [PriorizacaoService],
  exports: [PriorizacaoService],
})
export class PriorizacaoModule {}
