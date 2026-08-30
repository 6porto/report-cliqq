import { Controller, Get, Query } from '@nestjs/common';
import { FiltroIssuesDto } from './dto/filtro-issues.dto';
import { FiltroTagsDto } from './dto/filtro-tags.dto';
import { VersaoService } from './versao.service';

@Controller('versao')
export class VersaoController {
  constructor(private readonly versaoService: VersaoService) {}

  @Get('milestones')
  listarVersoes() {
    return this.versaoService.listarVersoes();
  }

  @Get('prontas')
  listarVersoesProntas() {
    return this.versaoService.listarVersoesProntas();
  }

  @Get('issues')
  listarIssues(@Query() filtro: FiltroIssuesDto) {
    return this.versaoService.listarIssues(filtro.milestone);
  }

  @Get('repositorios')
  listarRepositorios(@Query() filtro: FiltroIssuesDto) {
    return this.versaoService.listarRepositorios(filtro.milestone);
  }

  @Get('tags')
  listarTags(@Query() filtro: FiltroTagsDto) {
    return this.versaoService.listarTags(filtro.repositorio);
  }
}
