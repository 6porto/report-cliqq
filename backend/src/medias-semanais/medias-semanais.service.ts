import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalvarMediaSemanalDto } from './dto/salvar-media-semanal.dto';

@Injectable()
export class MediasSemanaisService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.mediaOperacoesSemanal.findMany({ orderBy: { semana: 'asc' } });
  }

  /**
   * Um lançamento por semana: relançar a mesma data corrige o valor. O PUT
   * substitui a semana inteira, então omitir as operações por sistema as limpa.
   */
  salvar(dto: SalvarMediaSemanalDto) {
    const semana = this.inicioDoDia(dto.semana);

    const valores = {
      mediaOperacoes: dto.mediaOperacoes,
      operacoesLegado: dto.operacoesLegado ?? null,
      operacoesCentralizado: dto.operacoesCentralizado ?? null,
    };

    return this.prisma.mediaOperacoesSemanal.upsert({
      where: { semana },
      create: { semana, ...valores },
      update: valores,
    });
  }

  async remover(id: number) {
    const existe = await this.prisma.mediaOperacoesSemanal.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existe) {
      throw new NotFoundException(`Lançamento ${id} não encontrado`);
    }

    return this.prisma.mediaOperacoesSemanal.delete({ where: { id } });
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
