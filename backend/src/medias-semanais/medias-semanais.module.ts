import { Module } from '@nestjs/common';
import { MediasSemanaisController } from './medias-semanais.controller';
import { MediasSemanaisService } from './medias-semanais.service';

@Module({
  controllers: [MediasSemanaisController],
  providers: [MediasSemanaisService],
  exports: [MediasSemanaisService],
})
export class MediasSemanaisModule {}
