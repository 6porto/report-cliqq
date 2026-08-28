import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalvarMelhoriaDto } from './dto/salvar-melhoria.dto';

const DIA_EM_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MelhoriasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pendentes primeiro, cada grupo pela data mais próxima. */
  listar() {
    return this.prisma.melhoria.findMany({
      orderBy: [{ subiuEmProducao: 'asc' }, { dataPrevista: 'asc' }, { criadoEm: 'asc' }],
    });
  }

  /**
   * As que ainda não subiram, mais as que subiram na última semana — é o que
   * interessa acompanhar no report.
   */
  emDestaque() {
    const limite = new Date(Date.now() - 7 * DIA_EM_MS);

    return this.prisma.melhoria.findMany({
      where: {
        OR: [{ subiuEmProducao: false }, { dataSubida: { gte: limite } }],
      },
      orderBy: [{ subiuEmProducao: 'asc' }, { dataPrevista: 'asc' }, { criadoEm: 'asc' }],
    });
  }

  async salvar(dto: SalvarMelhoriaDto) {
    const subiu = dto.subiuEmProducao ?? false;
    const anterior = dto.id
      ? await this.prisma.melhoria.findUnique({
          where: { id: dto.id },
          select: { subiuEmProducao: true, dataSubida: true },
        })
      : null;

    if (dto.id && !anterior) {
      throw new NotFoundException(`Melhoria ${dto.id} não encontrada`);
    }

    const valores = {
      descricao: dto.descricao.trim(),
      dataPrevista: dto.dataPrevista ? this.inicioDoDia(dto.dataPrevista) : null,
      subiuEmProducao: subiu,
      // A data da subida é do sistema: marcar registra agora, desmarcar limpa.
      dataSubida: subiu ? (anterior?.dataSubida ?? new Date()) : null,
    };

    if (dto.id) {
      return this.prisma.melhoria.update({ where: { id: dto.id }, data: valores });
    }

    return this.prisma.melhoria.create({ data: valores });
  }

  async remover(id: number) {
    const existe = await this.prisma.melhoria.findUnique({ where: { id }, select: { id: true } });

    if (!existe) {
      throw new NotFoundException(`Melhoria ${id} não encontrada`);
    }

    return this.prisma.melhoria.delete({ where: { id } });
  }

  // A data chega como 'YYYY-MM-DD' e é gravada à meia-noite UTC, para o dia não
  // escorregar conforme o fuso de quem cadastra.
  private inicioDoDia(valor: string) {
    const data = new Date(valor);

    return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  }
}
