import { Module } from '@nestjs/common';
import { RolloutController } from './rollout.controller';
import { RolloutService } from './rollout.service';

@Module({
  controllers: [RolloutController],
  providers: [RolloutService],
  exports: [RolloutService],
})
export class RolloutModule {}
