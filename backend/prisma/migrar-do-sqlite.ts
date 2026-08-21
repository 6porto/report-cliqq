import './carregar-env';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';

const arquivo = resolve(process.argv[2] ?? '');

if (!process.argv[2] || !existsSync(arquivo)) {
  console.error('Uso: npm run db:migrar-do-sqlite --workspace backend -- <caminho/rollout.db>');
  process.exit(1);
}

const prisma = new PrismaClient();

// O Prisma grava DATETIME no SQLite como epoch em ms, mas as colunas com
// DEFAULT CURRENT_TIMESTAMP guardam texto 'YYYY-MM-DD HH:MM:SS' em UTC.
function converterData(valor: unknown): Date | null {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number') return new Date(valor);
  if (typeof valor === 'bigint') return new Date(Number(valor));

  const texto = String(valor);
  const data = new Date(/[TZ]/.test(texto) ? texto : `${texto.replace(' ', 'T')}Z`);

  if (Number.isNaN(data.getTime())) {
    throw new Error(`Data inválida vinda do SQLite: ${texto}`);
  }

  return data;
}

function texto(valor: unknown): string | null {
  return valor === null || valor === undefined ? null : String(valor);
}

function inteiro(valor: unknown): number {
  return Number(valor ?? 0);
}

function inteiroOuNulo(valor: unknown): number | null {
  return valor === null || valor === undefined ? null : Number(valor);
}

function booleano(valor: unknown): boolean {
  return valor === true || valor === 1 || valor === 1n || valor === 'true';
}

async function ressincronizarSequencia(tabela: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${tabela}"', 'id'), COALESCE((SELECT MAX(id) FROM "${tabela}"), 1), (SELECT MAX(id) IS NOT NULL FROM "${tabela}"))`,
  );
}

async function main() {
  const sqlite = new DatabaseSync(arquivo, { readOnly: true });

  // Bancos anteriores à aba de priorização não têm Demanda/RespostaPriorizacao.
  const lerTabela = (nome: string) => {
    const existe = sqlite
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(nome);

    if (!existe) {
      console.warn(`Tabela ${nome} não existe no SQLite de origem, ignorando.`);
      return [];
    }

    return sqlite.prepare(`SELECT * FROM "${nome}"`).all() as Record<string, unknown>[];
  };

  const filiais = lerTabela('Filial');
  const eventos = lerTabela('EventoRollout');
  const metas = lerTabela('MetaRollout');
  const demandas = lerTabela('Demanda');
  const respostas = lerTabela('RespostaPriorizacao');

  sqlite.close();

  const jaTemDados = (await prisma.filial.count()) > 0;
  if (jaTemDados) {
    throw new Error('O Postgres já tem filiais. Rode a migração em um banco vazio.');
  }

  await prisma.filial.createMany({
    data: filiais.map((filial) => ({
      id: inteiro(filial.id),
      codigo: String(filial.codigo),
      cidade: texto(filial.cidade),
      uf: texto(filial.uf),
      regional: texto(filial.regional),
      onda: texto(filial.onda),
      mediaOperacoes90Dias: inteiro(filial.mediaOperacoes90Dias),
      status: String(filial.status),
      dataPrevista: converterData(filial.dataPrevista),
      dataInicio: converterData(filial.dataInicio),
      dataConclusao: converterData(filial.dataConclusao),
      observacao: texto(filial.observacao),
      criadoEm: converterData(filial.criadoEm) ?? new Date(),
      atualizadoEm: converterData(filial.atualizadoEm) ?? new Date(),
    })),
  });

  await prisma.eventoRollout.createMany({
    data: eventos.map((evento) => ({
      id: inteiro(evento.id),
      filialId: inteiro(evento.filialId),
      statusAnterior: texto(evento.statusAnterior),
      statusNovo: String(evento.statusNovo),
      observacao: texto(evento.observacao),
      autor: texto(evento.autor),
      registradoEm: converterData(evento.registradoEm) ?? new Date(),
    })),
  });

  await prisma.metaRollout.createMany({
    data: metas.map((meta) => ({
      id: inteiro(meta.id),
      data: converterData(meta.data) as Date,
      quantidadeAcumulada: inteiro(meta.quantidadeAcumulada),
      descricao: texto(meta.descricao),
    })),
  });

  await prisma.demanda.createMany({
    data: demandas.map((demanda) => ({
      id: inteiro(demanda.id),
      titulo: String(demanda.titulo),
      tipo: String(demanda.tipo),
      estado: texto(demanda.estado),
      url: String(demanda.url),
      ativa: booleano(demanda.ativa),
      sincronizadaEm: converterData(demanda.sincronizadaEm) ?? new Date(),
      criadaEm: converterData(demanda.criadaEm) ?? new Date(),
    })),
  });

  await prisma.respostaPriorizacao.createMany({
    data: respostas.map((resposta) => ({
      id: inteiro(resposta.id),
      demandaId: inteiro(resposta.demandaId),
      beneficiados: inteiroOuNulo(resposta.beneficiados),
      tipoDeGanho: inteiroOuNulo(resposta.tipoDeGanho),
      frequencia: inteiroOuNulo(resposta.frequencia),
      riscoDeAdiar: inteiroOuNulo(resposta.riscoDeAdiar),
      esforco: inteiroOuNulo(resposta.esforco),
      criadoEm: converterData(resposta.criadoEm) ?? new Date(),
      atualizadoEm: converterData(resposta.atualizadoEm) ?? new Date(),
    })),
  });

  // Demanda usa o id da issue do GitLab, sem sequência para ajustar.
  for (const tabela of ['Filial', 'EventoRollout', 'MetaRollout', 'RespostaPriorizacao']) {
    await ressincronizarSequencia(tabela);
  }

  console.log(
    `Migrado: ${filiais.length} filiais · ${eventos.length} eventos · ${metas.length} metas · ${demandas.length} demandas · ${respostas.length} respostas`,
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
