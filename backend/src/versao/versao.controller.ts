import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { VersaoService } from './versao.service';

@Controller('versao')
export class VersaoController {
  constructor(private readonly versaoService: VersaoService) {}

  @Get('milestones')
  listarVersoes() {
    return this.versaoService.listarVersoes();
  }

  @Get('milestones/:milestoneId/issues')
  listarIssues(@Param('milestoneId', ParseIntPipe) milestoneId: number) {
    return this.versaoService.listarIssues(milestoneId);
  }
}
