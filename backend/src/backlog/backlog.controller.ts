import { Controller, Get, Query } from '@nestjs/common';
import { BacklogService } from './backlog.service';
import { FiltroBacklogDto } from './dto/filtro-backlog.dto';

@Controller('backlog')
export class BacklogController {
  constructor(private readonly backlogService: BacklogService) {}

  @Get('sem-criticidade')
  listarSemCriticidade(@Query() filtro: FiltroBacklogDto) {
    return this.backlogService.listarSemCriticidade(filtro.dias ?? null);
  }
}
