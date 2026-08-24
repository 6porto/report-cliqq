import { Module } from '@nestjs/common';
import { LatenciasSemanaisController } from './latencias-semanais.controller';
import { LatenciasSemanaisService } from './latencias-semanais.service';

@Module({
  controllers: [LatenciasSemanaisController],
  providers: [LatenciasSemanaisService],
  exports: [LatenciasSemanaisService],
})
export class LatenciasSemanaisModule {}
