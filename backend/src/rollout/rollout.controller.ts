import { Body, Controller, Get, Param, ParseIntPipe, Patch, Put, Query } from '@nestjs/common';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { DefinirDatasDto } from './dto/definir-datas.dto';
import { DefinirMetasDto } from './dto/definir-metas.dto';
import { RolloutService } from './rollout.service';

@Controller('rollout')
export class RolloutController {
  constructor(private readonly rolloutService: RolloutService) {}

  @Patch('filiais/:id/status')
  atualizarStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarStatusDto) {
    return this.rolloutService.atualizarStatus(id, dto);
  }

  @Get('filiais/:id/datas')
  datasPorStatus(@Param('id', ParseIntPipe) id: number) {
    return this.rolloutService.datasPorStatus(id);
  }

  @Put('filiais/:id/datas')
  definirDatas(@Param('id', ParseIntPipe) id: number, @Body() dto: DefinirDatasDto) {
    return this.rolloutService.definirDatas(id, dto);
  }

  @Get('eventos')
  listarEventos(
    @Query('filialId') filialId?: string,
    @Query('limite') limite?: string,
  ) {
    return this.rolloutService.listarEventos(
      filialId ? Number(filialId) : undefined,
      limite ? Number(limite) : undefined,
    );
  }

  @Get('metas')
  listarMetas() {
    return this.rolloutService.listarMetas();
  }

  @Put('metas')
  definirMetas(@Body() dto: DefinirMetasDto) {
    return this.rolloutService.definirMetas(dto);
  }
}
