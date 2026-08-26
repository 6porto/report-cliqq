import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalvarLatenciaSemanalDto } from './dto/salvar-latencia-semanal.dto';

@Injectable()
export class LatenciasSemanaisService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.latenciaSemanal.findMany({ orderBy: { semana: 'asc' } });
  }

  /** Um lançamento por semana: relançar a mesma data corrige os valores. */
  salvar(dto: SalvarLatenciaSemanalDto) {
    const ate1s = dto.percentualAte1s ?? null;
    const ate3s = dto.percentualAte3s ?? null;

    // "Até 3s" é acumulado, então nunca fica abaixo de "até 1s".
    if (ate1s !== null && ate3s !== null && ate3s < ate1s) {
      throw new BadRequestException(
        'O % até 3 segundos inclui o de até 1 segundo, então não pode ser menor.',
      );
    }

    const semana = this.inicioDoDia(dto.semana);
    const valores = {
      percentualAte1s: ate1s,
      percentualAte3s: ate3s,
      percentualErros: dto.percentualErros ?? null,
      requisicoesAcima3s: dto.requisicoesAcima3s ?? null,
    };

    return this.prisma.latenciaSemanal.upsert({
      where: { semana },
      create: { semana, ...valores },
      update: valores,
    });
  }

  async remover(id: number) {
    const existe = await this.prisma.latenciaSemanal.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existe) {
      throw new NotFoundException(`Lançamento ${id} não encontrado`);
    }

    return this.prisma.latenciaSemanal.delete({ where: { id } });
  }

  // A data chega como 'YYYY-MM-DD' e é gravada à meia-noite UTC, para a semana
  // não escorregar conforme o fuso de quem lança.
  private inicioDoDia(valor: string) {
    const data = new Date(valor);

    return new Date(
      Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
    );
  }
}
