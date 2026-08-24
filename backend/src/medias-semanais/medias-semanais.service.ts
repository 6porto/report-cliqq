import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalvarMediaSemanalDto } from './dto/salvar-media-semanal.dto';

@Injectable()
export class MediasSemanaisService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.mediaOperacoesSemanal.findMany({ orderBy: { semana: 'asc' } });
  }

  /** Um lançamento por semana: relançar a mesma data corrige o valor. */
  salvar(dto: SalvarMediaSemanalDto) {
    const semana = this.inicioDoDia(dto.semana);

    return this.prisma.mediaOperacoesSemanal.upsert({
      where: { semana },
      create: { semana, mediaOperacoes: dto.mediaOperacoes },
      update: { mediaOperacoes: dto.mediaOperacoes },
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
