import { Module } from '@nestjs/common';
import { GitlabModule } from '../gitlab/gitlab.module';
import { VersaoController } from './versao.controller';
import { VersaoService } from './versao.service';

@Module({
  imports: [GitlabModule],
  controllers: [VersaoController],
  providers: [VersaoService],
})
export class VersaoModule {}
