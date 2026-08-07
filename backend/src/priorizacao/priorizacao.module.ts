import { Module } from '@nestjs/common';
import { GitlabModule } from '../gitlab/gitlab.module';
import { PriorizacaoController } from './priorizacao.controller';
import { PriorizacaoService } from './priorizacao.service';

@Module({
  imports: [GitlabModule],
  controllers: [PriorizacaoController],
  providers: [PriorizacaoService],
  exports: [PriorizacaoService],
})
export class PriorizacaoModule {}
