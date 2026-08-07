import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { SalvarRespostaDto } from './dto/salvar-resposta.dto';
import { PriorizacaoService } from './priorizacao.service';

@Controller('priorizacao')
export class PriorizacaoController {
  constructor(private readonly priorizacaoService: PriorizacaoService) {}

  @Get()
  listar() {
    return this.priorizacaoService.listar();
  }

  @Post('sincronizar')
  sincronizar() {
    return this.priorizacaoService.sincronizar();
  }

  @Put(':demandaId')
  salvar(@Param('demandaId', ParseIntPipe) demandaId: number, @Body() dto: SalvarRespostaDto) {
    return this.priorizacaoService.salvar(demandaId, dto);
  }
}
