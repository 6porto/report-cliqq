import { Module } from '@nestjs/common';
import { GitlabModule } from '../gitlab/gitlab.module';
import { BacklogController } from './backlog.controller';
import { BacklogService } from './backlog.service';

@Module({
  imports: [GitlabModule],
  controllers: [BacklogController],
  providers: [BacklogService],
})
export class BacklogModule {}
