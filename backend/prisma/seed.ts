import './carregar-env';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { ondaPorMediaDeOperacoes } from '../src/comum/ondas';

const prisma = new PrismaClient();

const ARQUIVO_LOJAS = join(__dirname, 'dados', 'lojas.tsv');

const CONECTIVOS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'del', 'd', 'na', 'no']);

interface LinhaLoja {
  codigo: string;
  mediaOperacoes90Dias: number;
  uf: string | null;
  cidade: string | null;
}

function normalizarNomeProprio(texto: string) {
  return texto
    .trim()
    .toLocaleLowerCase('pt-BR')
    .split(/\s+/)
    .map((palavra, indice) =>
      indice > 0 && CONECTIVOS.has(palavra)
        ? palavra
        : palavra.replace(/^[\p{L}]/u, (letra) => letra.toLocaleUpperCase('pt-BR')),
    )
    .join(' ');
}

function lerLojas(): LinhaLoja[] {
  const [, ...linhas] = readFileSync(ARQUIVO_LOJAS, 'utf8').split(/\r?\n/);

  return linhas
    .filter((linha) => linha.trim() !== '')
    .map((linha) => {
      const [codigo, media, uf, cidade] = linha.split('\t');
      const ufLimpa = uf?.trim().toUpperCase();
      const cidadeLimpa = cidade?.trim();

      return {
        codigo: codigo.trim(),
        mediaOperacoes90Dias: Number(media ?? 0),
        uf: ufLimpa && ufLimpa !== '#N/D' ? ufLimpa : null,
        cidade:
          cidadeLimpa && cidadeLimpa !== '#N/D' ? normalizarNomeProprio(cidadeLimpa) : null,
      };
    });
}

async function main() {
  const lojas = lerLojas();

  for (const loja of lojas) {
    const cadastro = {
      cidade: loja.cidade,
      uf: loja.uf,
      mediaOperacoes90Dias: loja.mediaOperacoes90Dias,
    };

    const onda = ondaPorMediaDeOperacoes(loja.mediaOperacoes90Dias);
    const existente = await prisma.filial.findUnique({
      where: { codigo: loja.codigo },
      select: { onda: true },
    });

    await prisma.filial.upsert({
      where: { codigo: loja.codigo },
      create: { codigo: loja.codigo, ...cadastro, onda },
      update: { ...cadastro, onda: existente?.onda ?? onda },
    });
  }

  const totalOperacoes = lojas.reduce((soma, loja) => soma + loja.mediaOperacoes90Dias, 0);
  const semUf = lojas.filter((loja) => loja.uf === null).length;

  const porOnda = await prisma.filial.groupBy({ by: ['onda'], _count: true });

  console.log(
    `Seed: ${lojas.length} lojas carregadas (${semUf} sem UF/cidade) · ${totalOperacoes} operações/dia somadas`,
  );
  console.log(
    `Ondas: ${porOnda
      .map((grupo) => `${grupo.onda ?? 'sem onda'}=${grupo._count}`)
      .sort()
      .join(' · ')}`,
  );
  console.log('Status, datas e ondas ajustadas manualmente foram preservados.');
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
