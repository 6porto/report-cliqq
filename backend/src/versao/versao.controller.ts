import { Controller, Get, Query } from '@nestjs/common';
import { FiltroIssuesDto } from './dto/filtro-issues.dto';
import { VersaoService } from './versao.service';

@Controller('versao')
export class VersaoController {
  constructor(private readonly versaoService: VersaoService) {}

  @Get('milestones')
  listarVersoes() {
    return this.versaoService.listarVersoes();
  }

  @Get('issues')
  listarIssues(@Query() filtro: FiltroIssuesDto) {
    return this.versaoService.listarIssues(filtro.milestone);
  }
}
