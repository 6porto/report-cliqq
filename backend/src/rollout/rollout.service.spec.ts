import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RolloutService } from './rollout.service';

describe('RolloutService', () => {
  let servico: RolloutService;
  let prisma: {
    filial: { findUnique: jest.Mock; update: jest.Mock };
    eventoRollout: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      filial: { findUnique: jest.fn(), update: jest.fn() },
      eventoRollout: {
        findMany: jest.fn(),
        create: jest.fn((argumentos) => ({ operacao: 'create', ...argumentos })),
        update: jest.fn((argumentos) => ({ operacao: 'update', ...argumentos })),
        delete: jest.fn((argumentos) => ({ operacao: 'delete', ...argumentos })),
      },
      $transaction: jest.fn(async (operacoes: unknown[]) => operacoes),
    };

    const modulo = await Test.createTestingModule({
      providers: [RolloutService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    servico = modulo.get(RolloutService);
  });

  describe('definirDatas', () => {
    const filial = { id: 1, status: 'NAO_INICIADO', dataInicio: null, dataConclusao: null };

    it('cria evento para status sem data e atualiza o que já existe', async () => {
      prisma.filial.findUnique.mockResolvedValue(filial);
      prisma.eventoRollout.findMany
        .mockResolvedValueOnce([
          {
            id: 10,
            statusAnterior: 'NAO_INICIADO',
            statusNovo: 'EM_TREINAMENTO',
            registradoEm: new Date('2026-08-01T00:00:00.000Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 10,
            statusAnterior: 'NAO_INICIADO',
            statusNovo: 'EM_TREINAMENTO',
            registradoEm: new Date('2026-08-02T00:00:00.000Z'),
          },
          {
            id: 11,
            statusAnterior: null,
            statusNovo: 'EM_ADAPTACAO',
            registradoEm: new Date('2026-08-10T00:00:00.000Z'),
          },
        ]);

      await servico.definirDatas(1, {
        datas: { EM_TREINAMENTO: '2026-08-02', EM_ADAPTACAO: '2026-08-10' },
      });

      expect(prisma.eventoRollout.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { registradoEm: new Date('2026-08-02') },
      });
      expect(prisma.eventoRollout.create).toHaveBeenCalledWith({
        data: {
          filialId: 1,
          statusNovo: 'EM_ADAPTACAO',
          registradoEm: new Date('2026-08-10'),
        },
      });
    });

    it('encadeia o statusAnterior e deixa a loja no status do último evento', async () => {
      prisma.filial.findUnique.mockResolvedValue(filial);
      prisma.eventoRollout.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          id: 10,
          statusAnterior: null,
          statusNovo: 'EM_TREINAMENTO',
          registradoEm: new Date('2026-08-01T00:00:00.000Z'),
        },
        {
          id: 11,
          statusAnterior: null,
          statusNovo: 'CONCLUIDO',
          registradoEm: new Date('2026-08-20T00:00:00.000Z'),
        },
      ]);

      await servico.definirDatas(1, { datas: { CONCLUIDO: '2026-08-20' } });

      expect(prisma.eventoRollout.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { statusAnterior: 'NAO_INICIADO' },
      });
      expect(prisma.eventoRollout.update).toHaveBeenCalledWith({
        where: { id: 11 },
        data: { statusAnterior: 'EM_TREINAMENTO' },
      });
      expect(prisma.filial.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'CONCLUIDO',
          dataInicio: new Date('2026-08-01T00:00:00.000Z'),
          dataConclusao: new Date('2026-08-20T00:00:00.000Z'),
        },
      });
    });

    it('apaga o evento quando a data vem nula', async () => {
      prisma.filial.findUnique.mockResolvedValue(filial);
      prisma.eventoRollout.findMany
        .mockResolvedValueOnce([
          {
            id: 10,
            statusAnterior: 'NAO_INICIADO',
            statusNovo: 'BLOQUEADO',
            registradoEm: new Date('2026-08-05T00:00:00.000Z'),
          },
        ])
        .mockResolvedValueOnce([]);

      await servico.definirDatas(1, { datas: { BLOQUEADO: null } });

      expect(prisma.eventoRollout.delete).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(prisma.filial.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'NAO_INICIADO', dataInicio: null, dataConclusao: null },
      });
    });

    it('recusa status desconhecido', async () => {
      prisma.filial.findUnique.mockResolvedValue(filial);
      prisma.eventoRollout.findMany.mockResolvedValue([]);

      await expect(
        servico.definirDatas(1, { datas: { INVENTADO: '2026-08-01' } as never }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('recusa data malformada', async () => {
      prisma.filial.findUnique.mockResolvedValue(filial);
      prisma.eventoRollout.findMany.mockResolvedValue([]);

      await expect(
        servico.definirDatas(1, { datas: { CONCLUIDO: 'ontem' } }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404 quando a filial não existe', async () => {
      prisma.filial.findUnique.mockResolvedValue(null);

      await expect(servico.definirDatas(99, { datas: {} })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
