import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { SalvarLatenciaSemanalDto } from './dto/salvar-latencia-semanal.dto';
import { LatenciasSemanaisService } from './latencias-semanais.service';

@Controller('latencias-semanais')
export class LatenciasSemanaisController {
  constructor(private readonly latenciasSemanaisService: LatenciasSemanaisService) {}

  @Get()
  listar() {
    return this.latenciasSemanaisService.listar();
  }

  @Put()
  salvar(@Body() dto: SalvarLatenciaSemanalDto) {
    return this.latenciasSemanaisService.salvar(dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.latenciasSemanaisService.remover(id);
  }
}
