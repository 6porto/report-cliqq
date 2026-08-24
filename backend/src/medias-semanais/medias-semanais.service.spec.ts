import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MediasSemanaisService } from './medias-semanais.service';

describe('MediasSemanaisService', () => {
  let servico: MediasSemanaisService;
  let prisma: {
    mediaOperacoesSemanal: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      upsert: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      mediaOperacoesSemanal: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
    };

    const modulo = await Test.createTestingModule({
      providers: [MediasSemanaisService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    servico = modulo.get(MediasSemanaisService);
  });

  describe('salvar', () => {
    it('grava a semana à meia-noite UTC e faz upsert pelo dia inicial', async () => {
      await servico.salvar({ semana: '2026-08-17', mediaOperacoes: 13050 });

      const meiaNoite = new Date(Date.UTC(2026, 7, 17));

      expect(prisma.mediaOperacoesSemanal.upsert).toHaveBeenCalledWith({
        where: { semana: meiaNoite },
        create: {
          semana: meiaNoite,
          mediaOperacoes: 13050,
          operacoesLegado: null,
          operacoesCentralizado: null,
          pedidosLegadoPiloto: null,
        },
        update: {
          mediaOperacoes: 13050,
          operacoesLegado: null,
          operacoesCentralizado: null,
          pedidosLegadoPiloto: null,
        },
      });
    });

    it('grava as operações de cada sistema quando informadas', async () => {
      await servico.salvar({
        semana: '2026-08-17',
        mediaOperacoes: 13050,
        operacoesLegado: 9000,
        operacoesCentralizado: 4050,
        pedidosLegadoPiloto: 1200,
      });

      expect(prisma.mediaOperacoesSemanal.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            mediaOperacoes: 13050,
            operacoesLegado: 9000,
            operacoesCentralizado: 4050,
            pedidosLegadoPiloto: 1200,
          },
        }),
      );
    });

    it('limpa as operações por sistema quando a semana é relançada sem elas', async () => {
      await servico.salvar({ semana: '2026-08-17', mediaOperacoes: 13050 });

      expect(prisma.mediaOperacoesSemanal.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            operacoesLegado: null,
            operacoesCentralizado: null,
            pedidosLegadoPiloto: null,
          }),
        }),
      );
    });

    it('descarta a hora quando a data vem com horário', async () => {
      await servico.salvar({ semana: '2026-08-17T18:45:00.000Z', mediaOperacoes: 10 });

      expect(prisma.mediaOperacoesSemanal.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { semana: new Date(Date.UTC(2026, 7, 17)) } }),
      );
    });
  });

  describe('remover', () => {
    it('apaga o lançamento existente', async () => {
      prisma.mediaOperacoesSemanal.findUnique.mockResolvedValue({ id: 7 });

      await servico.remover(7);

      expect(prisma.mediaOperacoesSemanal.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });

    it('404 quando o lançamento não existe', async () => {
      prisma.mediaOperacoesSemanal.findUnique.mockResolvedValue(null);

      await expect(servico.remover(7)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.mediaOperacoesSemanal.delete).not.toHaveBeenCalled();
    });
  });

  it('lista em ordem cronológica', async () => {
    prisma.mediaOperacoesSemanal.findMany.mockResolvedValue([]);

    await servico.listar();

    expect(prisma.mediaOperacoesSemanal.findMany).toHaveBeenCalledWith({
      orderBy: { semana: 'asc' },
    });
  });
});
