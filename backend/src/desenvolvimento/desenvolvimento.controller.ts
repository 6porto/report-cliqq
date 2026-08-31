import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DesenvolvimentoService } from './desenvolvimento.service';

@Controller('desenvolvimento')
export class DesenvolvimentoController {
  constructor(private readonly desenvolvimentoService: DesenvolvimentoService) {}

  @Get('milestones')
  listarMilestones() {
    return this.desenvolvimentoService.listarMilestones();
  }

  @Post('milestones/:id/fechar')
  fecharMilestone(@Param('id', ParseIntPipe) id: number) {
    return this.desenvolvimentoService.fecharMilestone(id);
  }
}
