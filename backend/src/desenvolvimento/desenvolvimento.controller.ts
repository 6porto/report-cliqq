import { Controller, Get } from '@nestjs/common';
import { DesenvolvimentoService } from './desenvolvimento.service';

@Controller('desenvolvimento')
export class DesenvolvimentoController {
  constructor(private readonly desenvolvimentoService: DesenvolvimentoService) {}

  @Get('milestones')
  listarMilestones() {
    return this.desenvolvimentoService.listarMilestones();
  }
}
