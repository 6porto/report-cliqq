import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { LatenciasSemanaisService } from './latencias-semanais.service';

describe('LatenciasSemanaisService', () => {
  let servico: LatenciasSemanaisService;
  let prisma: {
    latenciaSemanal: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      upsert: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      latenciaSemanal: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
    };

    const modulo = await Test.createTestingModule({
      providers: [LatenciasSemanaisService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    servico = modulo.get(LatenciasSemanaisService);
  });

  describe('salvar', () => {
    it('grava a semana à meia-noite UTC e faz upsert pelo dia inicial', async () => {
      await servico.salvar({ semana: '2026-08-17', p50: 120, p75: 200, p95: 480, p99: 900 });

      const meiaNoite = new Date(Date.UTC(2026, 7, 17));

      expect(prisma.latenciaSemanal.upsert).toHaveBeenCalledWith({
        where: { semana: meiaNoite },
        create: { semana: meiaNoite, p50: 120, p75: 200, p95: 480, p99: 900 },
        update: { p50: 120, p75: 200, p95: 480, p99: 900 },
      });
    });

    it('aceita percentis iguais', async () => {
      await servico.salvar({ semana: '2026-08-17', p50: 120, p75: 120, p95: 120, p99: 120 });

      expect(prisma.latenciaSemanal.upsert).toHaveBeenCalled();
    });

    it('recusa P75 menor que o P50', async () => {
      expect(() =>
        servico.salvar({ semana: '2026-08-17', p50: 200, p75: 120, p95: 480, p99: 900 }),
      ).toThrow(BadRequestException);
      expect(prisma.latenciaSemanal.upsert).not.toHaveBeenCalled();
    });

    it('recusa P95 menor que o P75', async () => {
      expect(() =>
        servico.salvar({ semana: '2026-08-17', p50: 120, p75: 480, p95: 200, p99: 900 }),
      ).toThrow(BadRequestException);
      expect(prisma.latenciaSemanal.upsert).not.toHaveBeenCalled();
    });

    it('recusa P99 menor que o P95', async () => {
      expect(() =>
        servico.salvar({ semana: '2026-08-17', p50: 120, p75: 200, p95: 480, p99: 300 }),
      ).toThrow(BadRequestException);
      expect(prisma.latenciaSemanal.upsert).not.toHaveBeenCalled();
    });
  });

  describe('remover', () => {
    it('apaga o lançamento existente', async () => {
      prisma.latenciaSemanal.findUnique.mockResolvedValue({ id: 3 });

      await servico.remover(3);

      expect(prisma.latenciaSemanal.delete).toHaveBeenCalledWith({ where: { id: 3 } });
    });

    it('404 quando o lançamento não existe', async () => {
      prisma.latenciaSemanal.findUnique.mockResolvedValue(null);

      await expect(servico.remover(3)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.latenciaSemanal.delete).not.toHaveBeenCalled();
    });
  });

  it('lista em ordem cronológica', async () => {
    prisma.latenciaSemanal.findMany.mockResolvedValue([]);

    await servico.listar();

    expect(prisma.latenciaSemanal.findMany).toHaveBeenCalledWith({
      orderBy: { semana: 'asc' },
    });
  });
});
