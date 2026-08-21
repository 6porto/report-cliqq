import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  STATUS_CONCLUIDO,
  STATUS_EM_IMPLANTACAO,
  STATUS_ROLLOUT,
  StatusRollout,
} from '../comum/status-rollout';
import { AtualizarStatusDto } from './dto/atualizar-status.dto';
import { DefinirDatasDto } from './dto/definir-datas.dto';
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

  /** Data em que a loja entrou em cada status, lida do histórico. */
  async datasPorStatus(filialId: number) {
    const eventos = await this.prisma.eventoRollout.findMany({
      where: { filialId },
      orderBy: { registradoEm: 'asc' },
    });

    const datas = Object.fromEntries(STATUS_ROLLOUT.map((status) => [status, null])) as Record<
      StatusRollout,
      Date | null
    >;

    for (const evento of eventos) {
      const status = evento.statusNovo as StatusRollout;

      if (datas[status] === null) {
        datas[status] = evento.registradoEm;
      }
    }

    return datas;
  }

  /**
   * Define a data em que a loja entrou em cada status. O histórico continua
   * sendo a única fonte: cada data vira um evento, e o status atual da loja
   * passa a ser o do evento mais recente.
   */
  async definirDatas(filialId: number, dto: DefinirDatasDto) {
    const filial = await this.prisma.filial.findUnique({ where: { id: filialId } });

    if (!filial) {
      throw new NotFoundException(`Filial ${filialId} não encontrada`);
    }

    const datas = this.validarDatas(dto.datas);
    const eventos = await this.prisma.eventoRollout.findMany({
      where: { filialId },
      orderBy: { registradoEm: 'asc' },
    });

    const sincronizacao: Prisma.PrismaPromise<unknown>[] = [];

    for (const [status, data] of datas) {
      const [primeiro, ...duplicados] = eventos.filter(
        (evento) => evento.statusNovo === status,
      );

      // Uma data por status: sobras de históricos antigos saem.
      for (const duplicado of duplicados) {
        sincronizacao.push(
          this.prisma.eventoRollout.delete({ where: { id: duplicado.id } }),
        );
      }

      if (data === null) {
        if (primeiro) {
          sincronizacao.push(
            this.prisma.eventoRollout.delete({ where: { id: primeiro.id } }),
          );
        }

        continue;
      }

      sincronizacao.push(
        primeiro
          ? this.prisma.eventoRollout.update({
              where: { id: primeiro.id },
              data: { registradoEm: data },
            })
          : this.prisma.eventoRollout.create({
              data: { filialId, statusNovo: status, registradoEm: data },
            }),
      );
    }

    if (sincronizacao.length > 0) {
      await this.prisma.$transaction(sincronizacao);
    }

    return this.recalcularApartirDosEventos(filialId);
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

  private validarDatas(datas: Partial<Record<StatusRollout, string | null>>) {
    return Object.entries(datas ?? {}).map(([status, valor]) => {
      if (!STATUS_ROLLOUT.includes(status as StatusRollout)) {
        throw new BadRequestException(`Status inválido: ${status}`);
      }

      if (valor === null || valor === undefined) {
        return [status as StatusRollout, null] as const;
      }

      const data = new Date(valor);

      if (Number.isNaN(data.getTime())) {
        throw new BadRequestException(`Data inválida para ${status}: ${valor}`);
      }

      return [status as StatusRollout, data] as const;
    });
  }

  /**
   * Depois de mexer nas datas, o encadeamento muda: cada evento passa a ter
   * como anterior o status do evento que ficou antes dele na linha do tempo.
   */
  private async recalcularApartirDosEventos(filialId: number) {
    const eventos = await this.prisma.eventoRollout.findMany({
      where: { filialId },
      orderBy: [{ registradoEm: 'asc' }, { id: 'asc' }],
    });

    const ajustes: Prisma.PrismaPromise<unknown>[] = [];
    let anterior: StatusRollout = 'NAO_INICIADO';

    for (const evento of eventos) {
      if (evento.statusAnterior !== anterior) {
        ajustes.push(
          this.prisma.eventoRollout.update({
            where: { id: evento.id },
            data: { statusAnterior: anterior },
          }),
        );
      }

      anterior = evento.statusNovo as StatusRollout;
    }

    const ultimo = eventos[eventos.length - 1];
    const status = (ultimo?.statusNovo as StatusRollout) ?? 'NAO_INICIADO';

    const entradaEmImplantacao = eventos.find((evento) =>
      [...STATUS_EM_IMPLANTACAO, STATUS_CONCLUIDO].includes(
        evento.statusNovo as StatusRollout,
      ),
    );
    const conclusao = eventos.find((evento) => evento.statusNovo === STATUS_CONCLUIDO);

    ajustes.push(
      this.prisma.filial.update({
        where: { id: filialId },
        data: {
          status,
          dataInicio: entradaEmImplantacao?.registradoEm ?? null,
          dataConclusao: status === STATUS_CONCLUIDO ? (conclusao?.registradoEm ?? null) : null,
        },
      }),
    );

    const resultados = await this.prisma.$transaction(ajustes);

    return resultados[resultados.length - 1];
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
