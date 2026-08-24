import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { SalvarMediaSemanalDto } from './dto/salvar-media-semanal.dto';
import { MediasSemanaisService } from './medias-semanais.service';

@Controller('medias-semanais')
export class MediasSemanaisController {
  constructor(private readonly mediasSemanaisService: MediasSemanaisService) {}

  @Get()
  listar() {
    return this.mediasSemanaisService.listar();
  }

  @Put()
  salvar(@Body() dto: SalvarMediaSemanalDto) {
    return this.mediasSemanaisService.salvar(dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.mediasSemanaisService.remover(id);
  }
}
