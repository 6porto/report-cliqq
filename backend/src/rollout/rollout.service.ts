import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STATUS_EM_IMPLANTACAO, StatusRollout } from '../comum/status-rollout';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { DefinirMetasDto } from './dto/definir-metas.dto';

@Injectable()
export class RolloutService {
  constructor(private readonly prisma: PrismaService) {}

  async atualizarStatus(filialId: number, dto: AtualizarStatusDto) {
    const filial = await this.prisma.filial.findUnique({ where: { id: filialId } });

    if (!filial) {
      throw new NotFoundException(`Filial ${filialId} não encontrada`);
    }

    const momento = dto.data ? new Date(dto.data) : new Date();
    const datas = this.calcularDatas(filial, dto.status, momento);

    const [atualizada] = await this.prisma.$transaction([
      this.prisma.filial.update({
        where: { id: filialId },
        data: {
          status: dto.status,
          observacao: dto.observacao ?? filial.observacao,
          ...datas,
        },
      }),
      this.prisma.eventoRollout.create({
        data: {
          filialId,
          statusAnterior: filial.status,
          statusNovo: dto.status,
          observacao: dto.observacao,
          autor: dto.autor,
          registradoEm: momento,
        },
      }),
    ]);

    return atualizada;
  }

  listarEventos(filialId?: number, limite = 100) {
    return this.prisma.eventoRollout.findMany({
      where: filialId ? { filialId } : undefined,
      include: { filial: { select: { codigo: true, cidade: true, uf: true, onda: true } } },
      orderBy: { registradoEm: 'desc' },
      take: limite,
    });
  }

  listarMetas() {
    return this.prisma.metaRollout.findMany({ orderBy: { data: 'asc' } });
  }

  async definirMetas(dto: DefinirMetasDto) {
    await this.prisma.$transaction(
      dto.metas.map((meta) =>
        this.prisma.metaRollout.upsert({
          where: { data: new Date(meta.data) },
          create: {
            data: new Date(meta.data),
            quantidadeAcumulada: meta.quantidadeAcumulada,
            descricao: meta.descricao,
          },
          update: {
            quantidadeAcumulada: meta.quantidadeAcumulada,
            descricao: meta.descricao,
          },
        }),
      ),
    );

    return this.listarMetas();
  }

  private calcularDatas(
    filial: { dataInicio: Date | null; dataConclusao: Date | null },
    status: StatusRollout,
    momento: Date,
  ) {
    if (status === 'CONCLUIDO') {
      return {
        dataInicio: filial.dataInicio ?? momento,
        dataConclusao: momento,
      };
    }

    if (STATUS_EM_IMPLANTACAO.includes(status)) {
      return { dataInicio: filial.dataInicio ?? momento, dataConclusao: null };
    }

    return { dataConclusao: null };
  }
}
