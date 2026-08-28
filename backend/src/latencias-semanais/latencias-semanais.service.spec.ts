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
      await servico.salvar({
        semana: '2026-08-17',
        percentualAte1s: 82.4,
        percentualAte3s: 95,
      });

      const meiaNoite = new Date(Date.UTC(2026, 7, 17));

      expect(prisma.latenciaSemanal.upsert).toHaveBeenCalledWith({
        where: { semana: meiaNoite },
        create: {
          semana: meiaNoite,
          percentualAte1s: 82.4,
          percentualAte3s: 95,
          percentualErros: null,
          requisicoesAcima3s: null,
        },
        update: {
          percentualAte1s: 82.4,
          percentualAte3s: 95,
          percentualErros: null,
          requisicoesAcima3s: null,
        },
      });
    });

    it('aceita a semana com só uma faixa apurada', async () => {
      await servico.salvar({ semana: '2026-08-17', percentualAte1s: 78.5 });

      expect(prisma.latenciaSemanal.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            percentualAte1s: 78.5,
            percentualAte3s: null,
            percentualErros: null,
            requisicoesAcima3s: null,
          },
        }),
      );
    });

    it('aceita fração nas requisições acima de 3s', async () => {
      await servico.salvar({ semana: '2026-08-17', requisicoesAcima3s: 12.5 });

      expect(prisma.latenciaSemanal.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ requisicoesAcima3s: 12.5 }),
        }),
      );
    });

    it('grava o % de erros da semana', async () => {
      await servico.salvar({ semana: '2026-08-17', percentualErros: 0.07 });

      expect(prisma.latenciaSemanal.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ percentualErros: 0.07 }),
        }),
      );
    });

    it('recusa o % até 3s menor que o de até 1s, que ele já inclui', async () => {
      expect(() =>
        servico.salvar({ semana: '2026-08-17', percentualAte1s: 90, percentualAte3s: 80 }),
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
