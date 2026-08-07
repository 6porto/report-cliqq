import { Injectable, NotFoundException } from '@nestjs/common';
import type { Demanda, RespostaPriorizacao } from '@prisma/client';
import {
  LABEL_DO_SISTEMA,
  TIPOS_SINCRONIZADOS,
  resumirSincronizacao,
  unirIssues,
  type IssueGitlab,
} from '../comum/issues-gitlab';
import { calcularPriorizacao } from '../comum/priorizacao';
import { GitlabService } from '../gitlab/gitlab.service';
import { PrismaService } from '../prisma/prisma.service';
import { SalvarRespostaDto } from './dto/salvar-resposta.dto';

@Injectable()
export class PriorizacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gitlab: GitlabService,
  ) {}

  async listar() {
    const demandas = await this.prisma.demanda.findMany({
      where: { ativa: true },
      orderBy: { id: 'desc' },
    });
    const respostas = await this.prisma.respostaPriorizacao.findMany();
    const porDemanda = new Map(respostas.map((resposta) => [resposta.demandaId, resposta]));

    return demandas.map((demanda) => montar(demanda, porDemanda.get(demanda.id) ?? null));
  }

  async salvar(demandaId: number, dto: SalvarRespostaDto) {
    const demanda = await this.prisma.demanda.findUnique({ where: { id: demandaId } });

    if (!demanda || !demanda.ativa) {
      throw new NotFoundException(`Demanda ${demandaId} não encontrada`);
    }

    const resposta = await this.prisma.respostaPriorizacao.upsert({
      where: { demandaId },
      create: { demandaId, ...dto },
      update: dto,
    });

    return montar(demanda, resposta);
  }

  /** As respostas nunca são apagadas: issue fora do filtro só perde o `ativa`. */
  async sincronizar() {
    const issues: IssueGitlab[] = [];

    for (const tipo of TIPOS_SINCRONIZADOS) {
      issues.push(...(await this.gitlab.listarIssuesAbertas([LABEL_DO_SISTEMA, `type::${tipo}`])));
    }

    const recebidas = unirIssues(issues);
    const conhecidas = await this.prisma.demanda.findMany({ select: { id: true, ativa: true } });
    const resumo = resumirSincronizacao(conhecidas, recebidas);

    await this.prisma.$transaction([
      ...recebidas.map((demanda) =>
        this.prisma.demanda.upsert({
          where: { id: demanda.id },
          create: { ...demanda, ativa: true },
          update: { ...demanda, ativa: true },
        }),
      ),
      this.prisma.demanda.updateMany({
        where: { id: { in: resumo.idsQueSairam } },
        data: { ativa: false },
      }),
    ]);

    return {
      novas: resumo.novas,
      atualizadas: resumo.atualizadas,
      sairam: resumo.sairam,
      total: resumo.total,
    };
  }
}

function montar(demanda: Demanda, registro: RespostaPriorizacao | null) {
  const resposta = registro
    ? {
        beneficiados: registro.beneficiados,
        tipoDeGanho: registro.tipoDeGanho,
        frequencia: registro.frequencia,
        riscoDeAdiar: registro.riscoDeAdiar,
        esforco: registro.esforco,
      }
    : null;

  return {
    id: demanda.id,
    titulo: demanda.titulo,
    tipo: demanda.tipo,
    estado: demanda.estado,
    url: demanda.url,
    resposta,
    ...calcularPriorizacao(resposta),
  };
}
