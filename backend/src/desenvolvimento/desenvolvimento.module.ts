import { Module } from '@nestjs/common';
import { GitlabModule } from '../gitlab/gitlab.module';
import { DesenvolvimentoController } from './desenvolvimento.controller';
import { DesenvolvimentoService } from './desenvolvimento.service';

@Module({
  imports: [GitlabModule],
  controllers: [DesenvolvimentoController],
  providers: [DesenvolvimentoService],
})
export class DesenvolvimentoModule {}
