import { Injectable, NotFoundException } from '@nestjs/common';
import {
  calcularPriorizacao,
  type RespostaPriorizacao as NotasPriorizacao,
} from '../comum/priorizacao';
import { PrismaService } from '../prisma/prisma.service';
import { DEMANDAS, type Demanda } from './demandas';
import { SalvarRespostaDto } from './dto/salvar-resposta.dto';

@Injectable()
export class PriorizacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const respostas = await this.prisma.respostaPriorizacao.findMany();
    const porDemanda = new Map(respostas.map((resposta) => [resposta.demandaId, resposta]));

    return DEMANDAS.map((demanda) => montar(demanda, porDemanda.get(demanda.id) ?? null));
  }

  async salvar(demandaId: number, dto: SalvarRespostaDto) {
    const demanda = DEMANDAS.find((item) => item.id === demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda ${demandaId} não encontrada`);
    }

    const resposta = await this.prisma.respostaPriorizacao.upsert({
      where: { demandaId },
      create: { demandaId, ...dto },
      update: dto,
    });

    return montar(demanda, resposta);
  }
}

function montar(demanda: Demanda, registro: NotasPriorizacao | null) {
  const resposta = registro
    ? {
        beneficiados: registro.beneficiados,
        tipoDeGanho: registro.tipoDeGanho,
        frequencia: registro.frequencia,
        riscoDeAdiar: registro.riscoDeAdiar,
        esforco: registro.esforco,
      }
    : null;

  return { ...demanda, resposta, ...calcularPriorizacao(resposta) };
}
