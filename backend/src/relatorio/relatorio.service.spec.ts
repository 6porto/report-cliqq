import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RelatorioService } from './relatorio.service';

describe('RelatorioService', () => {
  let servico: RelatorioService;
  let prisma: {
    filial: { findMany: jest.Mock; count: jest.Mock };
    metaRollout: { findMany: jest.Mock };
    eventoRollout: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      filial: { findMany: jest.fn(), count: jest.fn() },
      metaRollout: { findMany: jest.fn() },
      eventoRollout: { findMany: jest.fn() },
    };

    const modulo = await Test.createTestingModule({
      providers: [RelatorioService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    servico = modulo.get(RelatorioService);
  });

  describe('resumo', () => {
    it('calcula percentual concluído e atrasadas', async () => {
      const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);

      prisma.filial.findMany.mockResolvedValue([
        {
          status: 'CONCLUIDO',
          dataPrevista: ontem,
          dataConclusao: new Date(),
          mediaOperacoes90Dias: 90,
        },
        {
          status: 'EM_TREINAMENTO',
          dataPrevista: ontem,
          dataConclusao: null,
          mediaOperacoes90Dias: 30,
        },
        {
          status: 'NAO_INICIADO',
          dataPrevista: null,
          dataConclusao: null,
          mediaOperacoes90Dias: 60,
        },
        {
          status: 'BLOQUEADO',
          dataPrevista: ontem,
          dataConclusao: null,
          mediaOperacoes90Dias: 20,
        },
      ]);

      const resultado = await servico.resumo();

      expect(resultado.total).toBe(4);
      expect(resultado.concluidas).toBe(1);
      expect(resultado.percentualConcluido).toBe(25);
      expect(resultado.atrasadas).toBe(2);
      expect(resultado.porStatus.BLOQUEADO).toBe(1);
      expect(resultado.operacoesTotais).toBe(200);
      expect(resultado.operacoesConcluidas).toBe(90);
      expect(resultado.percentualOperacoesCobertas).toBe(45);
    });
  });

  describe('evolucao', () => {
    it('acumula conclusões por semana e repete a última meta informada', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { dataConclusao: new Date('2026-07-06T12:00:00.000Z') },
        { dataConclusao: new Date('2026-07-08T12:00:00.000Z') },
        { dataConclusao: new Date('2026-07-14T12:00:00.000Z') },
      ]);
      prisma.metaRollout.findMany.mockResolvedValue([
        { data: new Date('2026-07-06T00:00:00.000Z'), quantidadeAcumulada: 2 },
      ]);
      prisma.filial.count.mockResolvedValue(600);

      const { pontos, total } = await servico.evolucao('semana');

      expect(total).toBe(600);
      expect(pontos[0]).toMatchObject({
        periodo: '2026-07-06',
        realizado: 2,
        realizadoAcumulado: 2,
        metaAcumulada: 2,
      });
      expect(pontos[1]).toMatchObject({
        periodo: '2026-07-13',
        realizado: 1,
        realizadoAcumulado: 3,
        metaAcumulada: 2,
      });
    });

    it('retorna lista vazia quando não há conclusões nem metas', async () => {
      prisma.filial.findMany.mockResolvedValue([]);
      prisma.metaRollout.findMany.mockResolvedValue([]);
      prisma.filial.count.mockResolvedValue(600);

      const resultado = await servico.evolucao();

      expect(resultado.pontos).toEqual([]);
    });
  });

  describe('statusPorDia', () => {
    const criadoEm = new Date('2026-03-01T12:00:00.000Z');

    it('move a loja de status na data do evento e mantém o total', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { id: 1, status: 'CONCLUIDO', criadoEm },
        { id: 2, status: 'NAO_INICIADO', criadoEm },
      ]);
      prisma.eventoRollout.findMany.mockResolvedValue([
        {
          filialId: 1,
          statusAnterior: 'NAO_INICIADO',
          statusNovo: 'EM_TREINAMENTO',
          registradoEm: new Date('2026-03-02T09:00:00.000Z'),
        },
        {
          filialId: 1,
          statusAnterior: 'EM_TREINAMENTO',
          statusNovo: 'CONCLUIDO',
          registradoEm: new Date('2026-03-04T09:00:00.000Z'),
        },
      ]);

      const resultado = await servico.statusPorDia();

      expect(resultado.total).toBe(2);
      expect(resultado.pontos[0]).toMatchObject({
        dia: '2026-03-01',
        NAO_INICIADO: 2,
        EM_TREINAMENTO: 0,
        CONCLUIDO: 0,
      });
      expect(resultado.pontos[1]).toMatchObject({
        dia: '2026-03-02',
        NAO_INICIADO: 1,
        EM_TREINAMENTO: 1,
      });
      // Nada muda no dia 3: a contagem do dia 2 se mantém.
      expect(resultado.pontos[2]).toMatchObject({
        dia: '2026-03-03',
        EM_TREINAMENTO: 1,
      });
      expect(resultado.pontos[3]).toMatchObject({
        dia: '2026-03-04',
        EM_TREINAMENTO: 0,
        CONCLUIDO: 1,
        NAO_INICIADO: 1,
      });
      expect(resultado.pontos.every((ponto) => ponto.total === 2)).toBe(true);
    });

    it('inclui a loja já na data do evento quando ela é anterior ao cadastro', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { id: 1, status: 'CONCLUIDO', criadoEm: new Date('2026-03-10T12:00:00.000Z') },
      ]);
      prisma.eventoRollout.findMany.mockResolvedValue([
        {
          filialId: 1,
          statusAnterior: 'NAO_INICIADO',
          statusNovo: 'CONCLUIDO',
          registradoEm: new Date('2026-03-08T09:00:00.000Z'),
        },
      ]);

      const resultado = await servico.statusPorDia();

      expect(resultado.pontos[0]).toMatchObject({ dia: '2026-03-08', CONCLUIDO: 1, total: 1 });
      expect(resultado.pontos.every((ponto) => ponto.total === 1)).toBe(true);
    });

    it('usa o status atual de quem nunca teve evento', async () => {
      prisma.filial.findMany.mockResolvedValue([{ id: 1, status: 'BLOQUEADO', criadoEm }]);
      prisma.eventoRollout.findMany.mockResolvedValue([]);

      const resultado = await servico.statusPorDia();

      expect(resultado.pontos[0]).toMatchObject({ dia: '2026-03-01', BLOQUEADO: 1 });
    });

    it('devolve vazio sem filiais', async () => {
      prisma.filial.findMany.mockResolvedValue([]);
      prisma.eventoRollout.findMany.mockResolvedValue([]);

      expect(await servico.statusPorDia()).toEqual({ total: 0, pontos: [] });
    });
  });

  describe('porUf', () => {
    it('agrupa por UF, soma operações e trata UF ausente', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { uf: 'RS', status: 'CONCLUIDO', mediaOperacoes90Dias: 50 },
        { uf: 'RS', status: 'CONCLUIDO', mediaOperacoes90Dias: 30 },
        { uf: 'PR', status: 'CONCLUIDO', mediaOperacoes90Dias: 10 },
        { uf: 'PR', status: 'NAO_INICIADO', mediaOperacoes90Dias: 10 },
        { uf: null, status: 'NAO_INICIADO', mediaOperacoes90Dias: 5 },
      ]);

      const resultado = await servico.porUf();

      expect(resultado[0]).toMatchObject({
        nome: 'RS',
        total: 2,
        operacoes: 80,
        percentualConcluido: 100,
      });
      expect(resultado.find((grupo) => grupo.nome === 'PR')).toMatchObject({
        percentualConcluido: 50,
      });
      expect(resultado.find((grupo) => grupo.nome === 'Não informado')).toMatchObject({
        total: 1,
      });
    });
  });

  describe('coberturaPorOnda', () => {
    it('acumula o percentual de operações da rede ao fim de cada onda', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { onda: 'Onda 1', status: 'CONCLUIDO', mediaOperacoes90Dias: 50 },
        { onda: 'Onda 1', status: 'NAO_INICIADO', mediaOperacoes90Dias: 50 },
        { onda: 'Onda 2', status: 'NAO_INICIADO', mediaOperacoes90Dias: 60 },
        { onda: 'Onda 3', status: 'NAO_INICIADO', mediaOperacoes90Dias: 40 },
      ]);

      const resultado = await servico.coberturaPorOnda();

      expect(resultado.map((onda) => onda.nome)).toEqual(['Onda 1', 'Onda 2', 'Onda 3']);
      expect(resultado[0]).toMatchObject({
        lojas: 2,
        lojasConcluidas: 1,
        operacoes: 100,
        operacoesAcumuladas: 100,
        percentualDaRede: 50,
        percentualPrevistoAcumulado: 50,
        percentualRealizadoAcumulado: 25,
      });
      expect(resultado[1]).toMatchObject({
        operacoesAcumuladas: 160,
        percentualPrevistoAcumulado: 80,
        percentualRealizadoAcumulado: 25,
      });
      expect(resultado[2]).toMatchObject({
        operacoesAcumuladas: 200,
        percentualPrevistoAcumulado: 100,
      });
    });

    it('coloca lojas sem onda no fim e ignora ondas vazias', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { onda: 'Onda 1', status: 'NAO_INICIADO', mediaOperacoes90Dias: 40 },
        { onda: null, status: 'NAO_INICIADO', mediaOperacoes90Dias: 10 },
      ]);

      const resultado = await servico.coberturaPorOnda();

      expect(resultado.map((onda) => onda.nome)).toEqual(['Onda 1', 'Sem onda']);
      expect(resultado[1]).toMatchObject({ percentualPrevistoAcumulado: 100 });
    });
  });

  describe('distribuicaoHoraria', () => {
    it('normaliza os percentuais e distribui as operações da rede por hora', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { status: 'CONCLUIDO', mediaOperacoes90Dias: 1000 },
        { status: 'NAO_INICIADO', mediaOperacoes90Dias: 9000 },
      ]);

      const resultado = await servico.distribuicaoHoraria();

      expect(resultado.operacoesTotais).toBe(10000);
      expect(resultado.operacoesCobertas).toBe(1000);
      expect(resultado.horas).toHaveLength(12);
      expect(resultado.horaDePico).toBe('14h');

      const soma = resultado.horas.reduce((total, faixa) => total + faixa.percentual, 0);
      expect(soma).toBeCloseTo(100, 1);

      const operacoes = resultado.horas.reduce(
        (total, faixa) => total + faixa.operacoesRedeCompleta,
        0,
      );
      expect(operacoes).toBeGreaterThanOrEqual(9990);
      expect(operacoes).toBeLessThanOrEqual(10010);

      const pico = resultado.horas.find((faixa) => faixa.rotulo === '14h');
      expect(pico).toMatchObject({ percentualInformado: 10.51 });
      expect(pico?.percentual).toBeCloseTo(11.94, 1);
      expect(pico?.operacoesPorMinuto).toBeCloseTo((pico?.operacoesRedeCompleta ?? 0) / 60, 1);
      expect(resultado.operacoesPorMinutoNoPico).toBe(pico?.operacoesPorMinuto);
    });
  });

  describe('projecao', () => {
    const rede = (quantidade: number, media: number, onda = 'Onda 1') =>
      Array.from({ length: quantidade }, (_, indice) => ({
        codigo: `${onda}-${indice}`,
        onda,
        status: 'NAO_INICIADO',
        mediaOperacoes90Dias: media,
      }));

    it('cresce no percentual informado da primeira semana até o fim', async () => {
      prisma.filial.findMany.mockResolvedValue(rede(64, 10));

      const resultado = await servico.projecao(1);

      expect(resultado.operacoesTotais).toBe(640);
      expect(resultado.pontos[1]).toMatchObject({ semana: 1, operacoesAcumuladas: 10 });
      expect(resultado.pontos[2]).toMatchObject({ semana: 2, operacoesAcumuladas: 20 });
      expect(resultado.pontos[3]).toMatchObject({ semana: 3, operacoesAcumuladas: 40 });
      expect(resultado.pontos[4]).toMatchObject({ semana: 4, operacoesAcumuladas: 80 });
      expect(resultado.pontos.at(-1)).toMatchObject({
        operacoesAcumuladas: 640,
        percentualAcumulado: 100,
        lojasAcumuladas: 64,
      });
    });

    it('acrescenta apenas o necessário para bater a meta da semana', async () => {
      prisma.filial.findMany.mockResolvedValue(rede(20, 10));

      const resultado = await servico.projecao(0.25);

      expect(resultado.pontos[1]).toMatchObject({ operacoesAcumuladas: 10, lojasNaSemana: 1 });
      expect(resultado.pontos[2]).toMatchObject({ operacoesAcumuladas: 20, lojasNaSemana: 1 });
      expect(resultado.pontos[3]).toMatchObject({ operacoesAcumuladas: 30, lojasNaSemana: 1 });
      expect(resultado.pontos[4]).toMatchObject({ operacoesAcumuladas: 40, lojasNaSemana: 1 });
      expect(resultado.pontos[5]).toMatchObject({ operacoesAcumuladas: 50, lojasNaSemana: 1 });
    });

    it('respeita a ordem das ondas ao escolher quem entra', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { codigo: 'c', onda: 'Onda 3', status: 'NAO_INICIADO', mediaOperacoes90Dias: 5 },
        { codigo: 'a', onda: 'Onda 1', status: 'NAO_INICIADO', mediaOperacoes90Dias: 40 },
        { codigo: 'b', onda: 'Onda 2', status: 'NAO_INICIADO', mediaOperacoes90Dias: 20 },
      ]);

      const resultado = await servico.projecao(0.25);

      expect(resultado.pontos[1]).toMatchObject({ operacoesAcumuladas: 40, lojasAcumuladas: 1 });
      expect(resultado.pontos[2]).toMatchObject({ operacoesAcumuladas: 60, lojasAcumuladas: 2 });
      expect(resultado.semanasParaConcluir).toBe(3);
    });

    it('parte do que já está concluído', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { codigo: '1', onda: 'Onda 1', status: 'CONCLUIDO', mediaOperacoes90Dias: 80 },
        { codigo: '2', onda: 'Onda 1', status: 'NAO_INICIADO', mediaOperacoes90Dias: 20 },
      ]);

      const resultado = await servico.projecao(0.25);

      expect(resultado.pontos[0]).toMatchObject({
        semana: 0,
        lojasAcumuladas: 1,
        operacoesAcumuladas: 80,
      });
      expect(resultado.semanasParaConcluir).toBe(1);
    });
  });

  describe('porPorte', () => {
    it('classifica por faixa de média de operações e mantém a ordem das faixas', async () => {
      prisma.filial.findMany.mockResolvedValue([
        { mediaOperacoes90Dias: 95, status: 'CONCLUIDO' },
        { mediaOperacoes90Dias: 40, status: 'NAO_INICIADO' },
        { mediaOperacoes90Dias: 25, status: 'NAO_INICIADO' },
        { mediaOperacoes90Dias: 12, status: 'NAO_INICIADO' },
        { mediaOperacoes90Dias: 3, status: 'NAO_INICIADO' },
      ]);

      const resultado = await servico.porPorte();

      expect(resultado.map((grupo) => grupo.nome)).toEqual([
        'Alto (40+ op/dia)',
        'Médio (20 a 39)',
        'Baixo (10 a 19)',
        'Muito baixo (< 10)',
      ]);
      expect(resultado[0]).toMatchObject({ total: 2, operacoes: 135 });
    });
  });
});
