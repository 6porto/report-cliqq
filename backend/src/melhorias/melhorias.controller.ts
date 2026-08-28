import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { SalvarMelhoriaDto } from './dto/salvar-melhoria.dto';
import { MelhoriasService } from './melhorias.service';

@Controller('melhorias')
export class MelhoriasController {
  constructor(private readonly melhoriasService: MelhoriasService) {}

  @Get()
  listar() {
    return this.melhoriasService.listar();
  }

  @Get('destaque')
  emDestaque() {
    return this.melhoriasService.emDestaque();
  }

  @Put()
  salvar(@Body() dto: SalvarMelhoriaDto) {
    return this.melhoriasService.salvar(dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.melhoriasService.remover(id);
  }
}
