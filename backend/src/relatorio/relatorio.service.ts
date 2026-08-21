import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DISTRIBUICAO_HORARIA, PERCENTUAL_INFORMADO } from '../comum/distribuicao-horaria';
import { ONDAS } from '../comum/ondas';
import { STATUS_ROLLOUT, StatusRollout } from '../comum/status-rollout';

const SEM_ONDA = 'Sem onda';
const LIMITE_DE_SEMANAS = 260;
const LIMITE_DE_DIAS = 400;

export type Granularidade = 'semana' | 'mes';

const DIA_EM_MS = 24 * 60 * 60 * 1000;

const FAIXAS_DE_PORTE = [
  { nome: 'Alto (40+ op/dia)', minimo: 40 },
  { nome: 'Médio (20 a 39)', minimo: 20 },
  { nome: 'Baixo (10 a 19)', minimo: 10 },
  { nome: 'Muito baixo (< 10)', minimo: 0 },
];

@Injectable()
export class RelatorioService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo() {
    const filiais = await this.prisma.filial.findMany({
      select: {
        status: true,
        dataPrevista: true,
        dataConclusao: true,
        mediaOperacoes90Dias: true,
      },
    });

    const hoje = new Date();
    const limiteRecente = new Date(hoje.getTime() - 7 * DIA_EM_MS);

    const porStatus = Object.fromEntries(
      STATUS_ROLLOUT.map((status) => [
        status,
        filiais.filter((filial) => filial.status === status).length,
      ]),
    ) as Record<StatusRollout, number>;

    const total = filiais.length;
    const concluidas = porStatus.CONCLUIDO;

    const atrasadas = filiais.filter(
      (filial) =>
        filial.status !== 'CONCLUIDO' &&
        filial.dataPrevista !== null &&
        filial.dataPrevista < hoje,
    ).length;

    const concluidasUltimos7Dias = filiais.filter(
      (filial) => filial.dataConclusao !== null && filial.dataConclusao >= limiteRecente,
    ).length;

    const operacoesTotais = filiais.reduce(
      (soma, filial) => soma + filial.mediaOperacoes90Dias,
      0,
    );
    const operacoesConcluidas = filiais
      .filter((filial) => filial.status === 'CONCLUIDO')
      .reduce((soma, filial) => soma + filial.mediaOperacoes90Dias, 0);

    return {
      total,
      concluidas,
      pendentes: total - concluidas,
      percentualConcluido: total === 0 ? 0 : Number(((concluidas / total) * 100).toFixed(1)),
      atrasadas,
      concluidasUltimos7Dias,
      operacoesTotais,
      operacoesConcluidas,
      percentualOperacoesCobertas:
        operacoesTotais === 0
          ? 0
          : Number(((operacoesConcluidas / operacoesTotais) * 100).toFixed(1)),
      porStatus,
    };
  }

  async evolucao(granularidade: Granularidade = 'semana') {
    const [concluidas, metas, total] = await Promise.all([
      this.prisma.filial.findMany({
        where: { status: 'CONCLUIDO', dataConclusao: { not: null } },
        select: { dataConclusao: true },
        orderBy: { dataConclusao: 'asc' },
      }),
      this.prisma.metaRollout.findMany({ orderBy: { data: 'asc' } }),
      this.prisma.filial.count(),
    ]);

    const datas = [
      ...concluidas.map((filial) => filial.dataConclusao as Date),
      ...metas.map((meta) => meta.data),
    ];

    if (datas.length === 0) {
      return { total, granularidade, pontos: [] };
    }

    const inicio = this.inicioPeriodo(
      new Date(Math.min(...datas.map((data) => data.getTime()))),
      granularidade,
    );
    const fim = this.inicioPeriodo(
      new Date(Math.max(...datas.map((data) => data.getTime()), Date.now())),
      granularidade,
    );

    const realizadoPorPeriodo = new Map<string, number>();
    for (const filial of concluidas) {
      const chave = this.chave(this.inicioPeriodo(filial.dataConclusao as Date, granularidade));
      realizadoPorPeriodo.set(chave, (realizadoPorPeriodo.get(chave) ?? 0) + 1);
    }

    const metaPorPeriodo = new Map<string, number>();
    for (const meta of metas) {
      metaPorPeriodo.set(
        this.chave(this.inicioPeriodo(meta.data, granularidade)),
        meta.quantidadeAcumulada,
      );
    }

    const pontos: {
      periodo: string;
      realizado: number;
      realizadoAcumulado: number;
      metaAcumulada: number | null;
    }[] = [];

    let acumulado = 0;
    let ultimaMeta: number | null = null;

    for (
      let cursor = inicio;
      cursor <= fim;
      cursor = this.proximoPeriodo(cursor, granularidade)
    ) {
      const chave = this.chave(cursor);
      const realizado = realizadoPorPeriodo.get(chave) ?? 0;
      acumulado += realizado;
      ultimaMeta = metaPorPeriodo.get(chave) ?? ultimaMeta;

      pontos.push({
        periodo: chave,
        realizado,
        realizadoAcumulado: acumulado,
        metaAcumulada: ultimaMeta,
      });
    }

    return { total, granularidade, pontos };
  }

  /**
   * Refaz o histórico dia a dia a partir dos eventos: cada mudança tira a loja
   * de um status e coloca em outro na data em que aconteceu.
   */
  async statusPorDia() {
    const [filiais, eventos] = await Promise.all([
      this.prisma.filial.findMany({ select: { id: true, status: true, criadoEm: true } }),
      this.prisma.eventoRollout.findMany({
        select: { filialId: true, statusAnterior: true, statusNovo: true, registradoEm: true },
        orderBy: { registradoEm: 'asc' },
      }),
    ]);

    if (filiais.length === 0) {
      return { total: 0, pontos: [] };
    }

    const partida = new Map<number, StatusRollout>(
      filiais.map((filial) => [filial.id, filial.status as StatusRollout]),
    );
    const primeiroEvento = new Map<number, Date>();

    for (const evento of eventos) {
      if (primeiroEvento.has(evento.filialId)) {
        continue;
      }

      primeiroEvento.set(evento.filialId, evento.registradoEm);

      if (evento.statusAnterior) {
        partida.set(evento.filialId, evento.statusAnterior as StatusRollout);
      }
    }

    const deltas = new Map<string, Map<StatusRollout, number>>();

    const somar = (dia: Date, status: StatusRollout, quanto: number) => {
      const chave = this.chave(dia);
      const doDia = deltas.get(chave) ?? new Map<StatusRollout, number>();
      doDia.set(status, (doDia.get(status) ?? 0) + quanto);
      deltas.set(chave, doDia);
    };

    let inicio: Date | null = null;
    let fim = this.dia(new Date());

    for (const filial of filiais) {
      // Uma data de evento informada à mão pode ser anterior ao cadastro da
      // loja; nesse caso ela entra no gráfico já na data do evento.
      const evento = primeiroEvento.get(filial.id);
      const entrada = this.dia(
        evento && evento < filial.criadoEm ? evento : filial.criadoEm,
      );

      somar(entrada, partida.get(filial.id) as StatusRollout, 1);

      if (!inicio || entrada < inicio) {
        inicio = entrada;
      }
    }

    const corrente = new Map(partida);

    for (const evento of eventos) {
      const atual = corrente.get(evento.filialId);

      if (!atual) {
        continue;
      }

      const dia = this.dia(evento.registradoEm);
      somar(dia, atual, -1);
      somar(dia, evento.statusNovo as StatusRollout, 1);
      corrente.set(evento.filialId, evento.statusNovo as StatusRollout);

      if (dia > fim) {
        fim = dia;
      }
    }

    const contagem = new Map<StatusRollout, number>(STATUS_ROLLOUT.map((status) => [status, 0]));
    const pontos: ({ dia: string; total: number } & Record<StatusRollout, number>)[] = [];

    for (
      let cursor = inicio as Date;
      cursor <= fim;
      cursor = new Date(cursor.getTime() + DIA_EM_MS)
    ) {
      const chave = this.chave(cursor);

      for (const [status, valor] of deltas.get(chave) ?? []) {
        contagem.set(status, (contagem.get(status) ?? 0) + valor);
      }

      const porStatus = Object.fromEntries(contagem) as Record<StatusRollout, number>;

      pontos.push({
        dia: chave,
        total: STATUS_ROLLOUT.reduce((soma, status) => soma + porStatus[status], 0),
        ...porStatus,
      });
    }

    return { total: filiais.length, pontos: pontos.slice(-LIMITE_DE_DIAS) };
  }

  async porUf() {
    const filiais = await this.prisma.filial.findMany({
      select: { uf: true, status: true, mediaOperacoes90Dias: true },
    });

    return this.agrupar(filiais, (filial) => filial.uf ?? 'Não informado');
  }

  async porRegional() {
    const filiais = await this.prisma.filial.findMany({
      select: { regional: true, status: true, mediaOperacoes90Dias: true },
    });

    return this.agrupar(filiais, (filial) => filial.regional ?? 'Sem regional');
  }

  async porOnda() {
    const filiais = await this.prisma.filial.findMany({
      select: { onda: true, status: true, mediaOperacoes90Dias: true },
    });

    return this.agrupar(filiais, (filial) => filial.onda ?? 'Sem onda').sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR'),
    );
  }

  async coberturaPorOnda() {
    const filiais = await this.prisma.filial.findMany({
      select: { onda: true, status: true, mediaOperacoes90Dias: true },
    });

    const operacoesTotais = filiais.reduce(
      (soma, filial) => soma + filial.mediaOperacoes90Dias,
      0,
    );

    const nomesDeOndas = [
      ...ONDAS.map((onda) => onda.nome),
      ...[...new Set(filiais.map((filial) => filial.onda ?? SEM_ONDA))]
        .filter((nome) => !ONDAS.some((onda) => onda.nome === nome))
        .sort(),
    ];

    let operacoesAcumuladas = 0;
    let operacoesConcluidasAcumuladas = 0;

    return nomesDeOndas
      .map((nome) => {
        const daOnda = filiais.filter((filial) => (filial.onda ?? SEM_ONDA) === nome);
        const concluidas = daOnda.filter((filial) => filial.status === 'CONCLUIDO');

        const operacoes = daOnda.reduce((soma, filial) => soma + filial.mediaOperacoes90Dias, 0);
        const operacoesConcluidas = concluidas.reduce(
          (soma, filial) => soma + filial.mediaOperacoes90Dias,
          0,
        );

        operacoesAcumuladas += operacoes;
        operacoesConcluidasAcumuladas += operacoesConcluidas;

        return {
          nome,
          lojas: daOnda.length,
          lojasConcluidas: concluidas.length,
          operacoes,
          operacoesAcumuladas,
          operacoesConcluidasAcumuladas,
          percentualDaRede: this.percentual(operacoes, operacoesTotais),
          percentualPrevistoAcumulado: this.percentual(operacoesAcumuladas, operacoesTotais),
          percentualRealizadoAcumulado: this.percentual(
            operacoesConcluidasAcumuladas,
            operacoesTotais,
          ),
        };
      })
      .filter((onda) => onda.lojas > 0);
  }

  async distribuicaoHoraria() {
    const filiais = await this.prisma.filial.findMany({
      select: { status: true, mediaOperacoes90Dias: true },
    });

    const operacoesTotais = filiais.reduce(
      (soma, filial) => soma + filial.mediaOperacoes90Dias,
      0,
    );
    const operacoesCobertas = filiais
      .filter((filial) => filial.status === 'CONCLUIDO')
      .reduce((soma, filial) => soma + filial.mediaOperacoes90Dias, 0);

    const horas = DISTRIBUICAO_HORARIA.map((faixa) => {
      const percentual = (faixa.percentualInformado / PERCENTUAL_INFORMADO) * 100;
      const naRedeCompleta = Math.round((operacoesTotais * percentual) / 100);
      const naCobertura = Math.round((operacoesCobertas * percentual) / 100);

      return {
        hora: faixa.hora,
        rotulo: `${String(faixa.hora).padStart(2, '0')}h`,
        percentualInformado: faixa.percentualInformado,
        percentual: Number(percentual.toFixed(2)),
        operacoesRedeCompleta: naRedeCompleta,
        operacoesCobertas: naCobertura,
        operacoesPorMinuto: Number((naRedeCompleta / 60).toFixed(1)),
        operacoesPorMinutoCobertas: Number((naCobertura / 60).toFixed(1)),
      };
    });

    const pico = horas.reduce((maior, faixa) =>
      faixa.percentual > maior.percentual ? faixa : maior,
    );

    return {
      operacoesTotais,
      operacoesCobertas,
      percentualInformado: Number(PERCENTUAL_INFORMADO.toFixed(2)),
      horaDePico: pico.rotulo,
      operacoesNoPico: pico.operacoesRedeCompleta,
      operacoesPorMinutoNoPico: pico.operacoesPorMinuto,
      horas,
    };
  }

  async projecao(crescimentoSemanal = 0.25) {
    const filiais = await this.prisma.filial.findMany({
      select: { codigo: true, onda: true, status: true, mediaOperacoes90Dias: true },
    });

    const operacoesTotais = filiais.reduce(
      (soma, filial) => soma + filial.mediaOperacoes90Dias,
      0,
    );

    const pendentes = filiais
      .filter((filial) => filial.status !== 'CONCLUIDO')
      .sort(
        (a, b) =>
          this.ordemDaOnda(a.onda) - this.ordemDaOnda(b.onda) ||
          b.mediaOperacoes90Dias - a.mediaOperacoes90Dias,
      );

    const concluidas = filiais.filter((filial) => filial.status === 'CONCLUIDO');

    let operacoesAcumuladas = concluidas.reduce(
      (soma, filial) => soma + filial.mediaOperacoes90Dias,
      0,
    );
    let lojasAcumuladas = concluidas.length;

    const pontos = [
      {
        semana: 0,
        lojasNaSemana: lojasAcumuladas,
        lojasAcumuladas,
        operacoesNaSemana: operacoesAcumuladas,
        operacoesAcumuladas,
        percentualAcumulado: this.percentual(operacoesAcumuladas, operacoesTotais),
      },
    ];

    let semana = 0;

    while (pendentes.length > 0 && semana < LIMITE_DE_SEMANAS) {
      semana += 1;

      const meta =
        operacoesAcumuladas === 0
          ? pendentes[0].mediaOperacoes90Dias
          : operacoesAcumuladas * (1 + crescimentoSemanal);

      let operacoesNaSemana = 0;
      let lojasNaSemana = 0;

      while (pendentes.length > 0 && operacoesAcumuladas < meta) {
        const loja = pendentes.shift() as (typeof filiais)[number];
        operacoesAcumuladas += loja.mediaOperacoes90Dias;
        operacoesNaSemana += loja.mediaOperacoes90Dias;
        lojasAcumuladas += 1;
        lojasNaSemana += 1;
      }

      pontos.push({
        semana,
        lojasNaSemana,
        lojasAcumuladas,
        operacoesNaSemana,
        operacoesAcumuladas,
        percentualAcumulado: this.percentual(operacoesAcumuladas, operacoesTotais),
      });
    }

    return {
      crescimentoSemanal,
      operacoesTotais,
      totalDeLojas: filiais.length,
      semanasParaConcluir: semana,
      pontos,
    };
  }

  private ordemDaOnda(onda: string | null) {
    const posicao = ONDAS.findIndex((definicao) => definicao.nome === onda);
    return posicao === -1 ? ONDAS.length : posicao;
  }

  private percentual(parte: number, total: number) {
    return total === 0 ? 0 : Number(((parte / total) * 100).toFixed(1));
  }

  async porPorte() {
    const filiais = await this.prisma.filial.findMany({
      select: { mediaOperacoes90Dias: true, status: true },
    });

    const grupos = this.agrupar(filiais, (filial) =>
      this.faixaDePorte(filial.mediaOperacoes90Dias),
    );

    return FAIXAS_DE_PORTE.map((faixa) => grupos.find((grupo) => grupo.nome === faixa.nome)).filter(
      (grupo): grupo is (typeof grupos)[number] => Boolean(grupo),
    );
  }

  private faixaDePorte(mediaOperacoes: number) {
    return (
      FAIXAS_DE_PORTE.find((faixa) => mediaOperacoes >= faixa.minimo)?.nome ??
      FAIXAS_DE_PORTE[FAIXAS_DE_PORTE.length - 1].nome
    );
  }

  private agrupar<T extends { status: string; mediaOperacoes90Dias?: number }>(
    itens: T[],
    chave: (item: T) => string,
  ) {
    const grupos = new Map<string, T[]>();

    for (const item of itens) {
      const nome = chave(item);
      grupos.set(nome, [...(grupos.get(nome) ?? []), item]);
    }

    return [...grupos.entries()]
      .map(([nome, itensDoGrupo]) => {
        const porStatus = Object.fromEntries(
          STATUS_ROLLOUT.map((status) => [
            status,
            itensDoGrupo.filter((item) => item.status === status).length,
          ]),
        ) as Record<StatusRollout, number>;

        const total = itensDoGrupo.length;
        const operacoes = itensDoGrupo.reduce(
          (soma, item) => soma + (item.mediaOperacoes90Dias ?? 0),
          0,
        );

        return {
          nome,
          total,
          operacoes,
          percentualConcluido:
            total === 0 ? 0 : Number(((porStatus.CONCLUIDO / total) * 100).toFixed(1)),
          ...porStatus,
        };
      })
      .sort((a, b) => b.percentualConcluido - a.percentualConcluido);
  }

  private inicioPeriodo(data: Date, granularidade: Granularidade) {
    const referencia = new Date(
      Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()),
    );

    if (granularidade === 'mes') {
      return new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), 1));
    }

    const diaDaSemana = (referencia.getUTCDay() + 6) % 7;
    return new Date(referencia.getTime() - diaDaSemana * DIA_EM_MS);
  }

  private proximoPeriodo(data: Date, granularidade: Granularidade) {
    if (granularidade === 'mes') {
      return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 1));
    }

    return new Date(data.getTime() + 7 * DIA_EM_MS);
  }

  private dia(data: Date) {
    return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
  }

  private chave(data: Date) {
    return data.toISOString().slice(0, 10);
  }
}
