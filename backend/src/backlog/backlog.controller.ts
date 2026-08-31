import { Body, Controller, Get, Param, ParseIntPipe, Put, Query } from '@nestjs/common';
import { BacklogService } from './backlog.service';
import { DefinirCriticidadeDto } from './dto/definir-criticidade.dto';
import { FiltroBacklogDto } from './dto/filtro-backlog.dto';

@Controller('backlog')
export class BacklogController {
  constructor(private readonly backlogService: BacklogService) {}

  @Get('sem-criticidade')
  listarSemCriticidade(@Query() filtro: FiltroBacklogDto) {
    return this.backlogService.listarSemCriticidade(filtro.dias ?? null);
  }

  @Put('issues/:iid/criticidade')
  definirCriticidade(
    @Param('iid', ParseIntPipe) iid: number,
    @Body() corpo: DefinirCriticidadeDto,
  ) {
    return this.backlogService.definirCriticidade(iid, corpo.criticidade);
  }
}
