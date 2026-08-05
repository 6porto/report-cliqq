import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AtualizarFilialDto } from './dto/atualizar-filial.dto';
import { CriarFilialDto } from './dto/criar-filial.dto';
import { FiltroFiliaisDto } from './dto/filtro-filiais.dto';
import { ImportarFiliaisDto } from './dto/importar-filiais.dto';
import { FiliaisService } from './filiais.service';

@Controller('filiais')
export class FiliaisController {
  constructor(private readonly filiaisService: FiliaisService) {}

  @Get()
  listar(@Query() filtro: FiltroFiliaisDto) {
    return this.filiaisService.listar(filtro);
  }

  @Get('filtros')
  filtros() {
    return this.filiaisService.filtrosDisponiveis();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.filiaisService.buscarPorId(id);
  }

  @Post()
  criar(@Body() dto: CriarFilialDto) {
    return this.filiaisService.criar(dto);
  }

  @Post('importar')
  importar(@Body() dto: ImportarFiliaisDto) {
    return this.filiaisService.importar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarFilialDto) {
    return this.filiaisService.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.filiaisService.remover(id);
  }
}
