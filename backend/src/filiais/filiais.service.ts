import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AtualizarFilialDto } from './dto/atualizar-filial.dto';
import { CriarFilialDto } from './dto/criar-filial.dto';
import { FiltroFiliaisDto } from './dto/filtro-filiais.dto';
import { ImportarFiliaisDto } from './dto/importar-filiais.dto';

@Injectable()
export class FiliaisService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtro: FiltroFiliaisDto) {
    const pagina = filtro.pagina ?? 1;
    const tamanho = filtro.tamanho ?? 50;
    const where = this.montarWhere(filtro);

    const [itens, total] = await Promise.all([
      this.prisma.filial.findMany({
        where,
        orderBy: this.montarOrdenacao(filtro),
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
      this.prisma.filial.count({ where }),
    ]);

    return { itens, total, pagina, tamanho };
  }

  async buscarPorId(id: number) {
    const filial = await this.prisma.filial.findUnique({
      where: { id },
      include: { eventos: { orderBy: { registradoEm: 'desc' } } },
    });

    if (!filial) {
      throw new NotFoundException(`Filial ${id} não encontrada`);
    }

    return filial;
  }

  criar(dto: CriarFilialDto) {
    return this.executarProtegendoCodigo(dto.codigo, () =>
      this.prisma.filial.create({ data: this.montarCriacao(dto) }),
    );
  }

  async atualizar(id: number, dto: AtualizarFilialDto) {
    await this.garantirExistencia(id);

    return this.executarProtegendoCodigo(dto.codigo, () =>
      this.prisma.filial.update({ where: { id }, data: this.montarAtualizacao(dto) }),
    );
  }

  async remover(id: number) {
    await this.garantirExistencia(id);
    return this.prisma.filial.delete({ where: { id } });
  }

  async importar(dto: ImportarFiliaisDto) {
    const resultados = await this.prisma.$transaction(
      dto.filiais.map((filial) =>
        this.prisma.filial.upsert({
          where: { codigo: filial.codigo },
          create: this.montarCriacao(filial),
          update: this.montarAtualizacao(filial),
        }),
      ),
    );

    return { importadas: resultados.length };
  }

  async filtrosDisponiveis() {
    const filiais = await this.prisma.filial.findMany({
      select: { regional: true, uf: true, onda: true },
    });

    const distintos = (valores: (string | null)[]) =>
      [...new Set(valores.filter((valor): valor is string => Boolean(valor)))].sort();

    return {
      regionais: distintos(filiais.map((filial) => filial.regional)),
      ufs: distintos(filiais.map((filial) => filial.uf)),
      ondas: distintos(filiais.map((filial) => filial.onda)),
    };
  }

  private montarOrdenacao(filtro: FiltroFiliaisDto): Prisma.FilialOrderByWithRelationInput[] {
    if (!filtro.ordenarPor) {
      return [{ onda: 'asc' }, { mediaOperacoes90Dias: 'desc' }];
    }

    const direcao = filtro.direcao ?? 'asc';

    return [{ [filtro.ordenarPor]: direcao }, { mediaOperacoes90Dias: 'desc' }];
  }

  private montarWhere(filtro: FiltroFiliaisDto): Prisma.FilialWhereInput {
    return {
      status: filtro.status,
      regional: filtro.regional,
      uf: filtro.uf,
      onda: filtro.onda,
      ...(filtro.busca
        ? {
            OR: [
              { codigo: { contains: filtro.busca } },
              { cidade: { contains: filtro.busca } },
            ],
          }
        : {}),
    };
  }

  private montarCriacao(dto: CriarFilialDto): Prisma.FilialCreateInput {
    return { ...dto, ...this.converterTextos(dto), ...this.converterDatas(dto) };
  }

  private montarAtualizacao(dto: AtualizarFilialDto): Prisma.FilialUpdateInput {
    return { ...dto, ...this.converterTextos(dto), ...this.converterDatas(dto) };
  }

  private converterTextos(dto: AtualizarFilialDto) {
    const limpar = (valor?: string | null) =>
      valor === undefined ? undefined : valor?.trim() ? valor.trim() : null;

    return {
      cidade: limpar(dto.cidade),
      uf: dto.uf?.trim() ? dto.uf.trim().toUpperCase() : limpar(dto.uf),
      regional: limpar(dto.regional),
      onda: limpar(dto.onda),
      observacao: limpar(dto.observacao),
    };
  }

  private converterDatas(dto: AtualizarFilialDto) {
    const converter = (valor?: string | null) =>
      valor === undefined ? undefined : valor ? new Date(valor) : null;

    return {
      dataPrevista: converter(dto.dataPrevista),
      dataInicio: converter(dto.dataInicio),
      dataConclusao: converter(dto.dataConclusao),
    };
  }

  private async executarProtegendoCodigo<T>(codigo: string | undefined, acao: () => Promise<T>) {
    try {
      return await acao();
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new ConflictException(`Já existe uma loja com o código ${codigo}`);
      }

      throw erro;
    }
  }

  private async garantirExistencia(id: number) {
    const existe = await this.prisma.filial.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      throw new NotFoundException(`Filial ${id} não encontrada`);
    }
  }
}
