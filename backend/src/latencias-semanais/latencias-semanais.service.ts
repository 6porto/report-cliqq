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
    // Percentil maior nunca é menor que o anterior.
    if (dto.p75 < dto.p50 || dto.p95 < dto.p75 || dto.p99 < dto.p95) {
      throw new BadRequestException('Os percentis devem crescer: P50 ≤ P75 ≤ P95 ≤ P99.');
    }

    const semana = this.inicioDoDia(dto.semana);
    const valores = { p50: dto.p50, p75: dto.p75, p95: dto.p95, p99: dto.p99 };

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
