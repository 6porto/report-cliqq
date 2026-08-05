import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FiliaisService } from './filiais.service';

describe('FiliaisService', () => {
  let servico: FiliaisService;
  let prisma: { filial: { findMany: jest.Mock; count: jest.Mock } };

  beforeEach(async () => {
    prisma = { filial: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) } };

    const modulo = await Test.createTestingModule({
      providers: [FiliaisService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    servico = modulo.get(FiliaisService);
  });

  describe('listar', () => {
    it('ordena por onda e volume quando nenhuma coluna é escolhida', async () => {
      await servico.listar({});

      expect(prisma.filial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ onda: 'asc' }, { mediaOperacoes90Dias: 'desc' }],
        }),
      );
    });

    it('ordena pela coluna e direção informadas', async () => {
      await servico.listar({ ordenarPor: 'cidade', direcao: 'desc' });

      expect(prisma.filial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ cidade: 'desc' }, { mediaOperacoes90Dias: 'desc' }],
        }),
      );
    });

    it('assume ordem crescente quando só a coluna é informada', async () => {
      await servico.listar({ ordenarPor: 'dataConclusao' });

      expect(prisma.filial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ dataConclusao: 'asc' }, { mediaOperacoes90Dias: 'desc' }],
        }),
      );
    });

    it('pagina a partir da página e tamanho', async () => {
      await servico.listar({ pagina: 3, tamanho: 25 });

      expect(prisma.filial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 50, take: 25 }),
      );
    });
  });
});
