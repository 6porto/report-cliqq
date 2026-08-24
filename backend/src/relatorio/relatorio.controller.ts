import { Controller, Get, Query } from '@nestjs/common';
import { Granularidade, RelatorioService } from './relatorio.service';

@Controller('relatorio')
export class RelatorioController {
  constructor(private readonly relatorioService: RelatorioService) {}

  @Get('resumo')
  resumo() {
    return this.relatorioService.resumo();
  }

  @Get('evolucao')
  evolucao(@Query('granularidade') granularidade?: Granularidade) {
    return this.relatorioService.evolucao(granularidade === 'mes' ? 'mes' : 'semana');
  }

  @Get('status-por-dia')
  statusPorDia() {
    return this.relatorioService.statusPorDia();
  }

  @Get('uf')
  porUf() {
    return this.relatorioService.porUf();
  }

  @Get('projecao')
  projecao(@Query('crescimento') crescimento?: string) {
    const percentual = Number(crescimento);
    const crescimentoSemanal =
      Number.isFinite(percentual) && percentual > 0 && percentual <= 200 ? percentual / 100 : 0.25;

    return this.relatorioService.projecao(crescimentoSemanal);
  }

  @Get('distribuicao-horaria')
  distribuicaoHoraria() {
    return this.relatorioService.distribuicaoHoraria();
  }

  @Get('operacoes-esperadas')
  operacoesEsperadasPorDia() {
    return this.relatorioService.operacoesEsperadasPorDia();
  }

  @Get('cobertura-ondas')
  coberturaPorOnda() {
    return this.relatorioService.coberturaPorOnda();
  }

  @Get('porte')
  porPorte() {
    return this.relatorioService.porPorte();
  }

  @Get('regional')
  porRegional() {
    return this.relatorioService.porRegional();
  }

  @Get('ondas')
  porOnda() {
    return this.relatorioService.porOnda();
  }
}
