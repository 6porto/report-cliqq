import type { DemandaPriorizada, RespostaPriorizacao } from '../api/tipos';

export const CRITERIOS_DE_VALOR = [
  {
    chave: 'beneficiados',
    pergunta:
      'De todos os usuários da aplicação que receberá a melhoria, qual a quantidade de beneficiados?',
    opcoes: [
      { pontos: 5, rotulo: 'Alguns usuários específicos' },
      { pontos: 10, rotulo: 'Uma parcela/grupo específico de usuários' },
      { pontos: 20, rotulo: 'A maior parte dos usuários' },
    ],
  },
  {
    chave: 'tipoDeGanho',
    pergunta: 'Qual o tipo de ganho?',
    opcoes: [
      { pontos: 5, rotulo: 'Produtividade/UX' },
      { pontos: 10, rotulo: 'Operacional/Financeiro mensurável' },
      { pontos: 20, rotulo: 'Demanda estratégica' },
    ],
  },
  {
    chave: 'frequencia',
    pergunta: 'Com que frequência essa melhoria será utilizada?',
    opcoes: [
      { pontos: 5, rotulo: 'Semanalmente' },
      { pontos: 10, rotulo: 'Diariamente' },
      { pontos: 20, rotulo: 'Todo momento' },
    ],
  },
  {
    chave: 'riscoDeAdiar',
    pergunta: 'Qual o risco/custo de oportunidade de adiar essa melhoria?',
    opcoes: [
      { pontos: 5, rotulo: 'Nenhum' },
      { pontos: 10, rotulo: 'Baixo ou moderado' },
      { pontos: 20, rotulo: 'Elevado' },
    ],
  },
  {
    chave: 'contorno',
    pergunta:
      'Existe alguma forma de contornar o problema ou realizar a atividade hoje, sem essa correção/melhoria?',
    opcoes: [
      {
        pontos: 5,
        rotulo:
          'Sim, existe contorno simples — o usuário resolve sozinho, sem impacto relevante no dia a dia',
        apoio: 'O sistema não bloqueia ninguém; a dor é pequena',
      },
      {
        pontos: 10,
        rotulo:
          'Sim, mas o contorno é custoso — exige processo manual, retrabalho, intervenção de outra equipe (TI, suporte) ou gera risco de erro',
        apoio: 'Dá para viver com isso, mas tem custo operacional recorrente',
      },
      {
        pontos: 20,
        rotulo:
          'Não existe contorno — a operação fica bloqueada ou a informação/função é simplesmente inacessível até a entrega',
        apoio: 'Sem alternativa, cada dia sem solução é dia de operação parada ou perda',
      },
    ],
  },
] as const;

export const CRITERIO_DE_ESFORCO = {
  chave: 'esforco',
  pergunta: 'Qual o esforço estimado para o desenvolvimento?',
  opcoes: [
    { pontos: 20, rotulo: '1 dia' },
    { pontos: 17, rotulo: '2 dias' },
    { pontos: 14, rotulo: '1 semana' },
    { pontos: 11, rotulo: '2 semanas' },
    { pontos: 8, rotulo: '1 mês' },
    { pontos: 5, rotulo: '2 meses' },
    { pontos: 2, rotulo: 'mais de 2 meses' },
  ],
} as const;

export type CampoResposta = keyof RespostaPriorizacao;

export interface Pergunta {
  chave: CampoResposta;
  pergunta: string;
  /** `apoio` explica quando escolher a opção; nem toda pergunta tem. */
  opcoes: readonly { pontos: number; rotulo: string; apoio?: string }[];
}

export const PERGUNTAS: Pergunta[] = [...CRITERIOS_DE_VALOR, CRITERIO_DE_ESFORCO];

/** Eixo X do gráfico: tempo de desenvolvimento crescendo da esquerda para a direita. */
export const POSICOES_DE_ESFORCO = CRITERIO_DE_ESFORCO.opcoes.map((opcao) => opcao.rotulo);

/** Ganho rápido: valor alto e esforço de até 2 dias. */
export const POSICAO_MAXIMA_DE_GANHO_RAPIDO = 1;

export const PONTUACAO_VALOR_MINIMA = CRITERIOS_DE_VALOR.length * 5;
export const PONTUACAO_VALOR_MAXIMA = CRITERIOS_DE_VALOR.length * 20;
export const CORTE_GANHO_RAPIDO = (PONTUACAO_VALOR_MINIMA + PONTUACAO_VALOR_MAXIMA) / 2;

export function ehGanhoRapido(demanda: DemandaPriorizada) {
  return (
    demanda.completa &&
    (demanda.pontuacaoValor ?? 0) >= CORTE_GANHO_RAPIDO &&
    (demanda.posicaoEsforco ?? Infinity) <= POSICAO_MAXIMA_DE_GANHO_RAPIDO
  );
}

export function respondidas(resposta: RespostaPriorizacao | null) {
  if (!resposta) {
    return 0;
  }

  return PERGUNTAS.filter((pergunta) => resposta[pergunta.chave] !== null).length;
}

export const ROTULO_TIPO: Record<string, string> = {
  crm: 'CRM',
  melhoria: 'Melhoria',
};

export function ordenarPorPrioridade(demandas: DemandaPriorizada[]) {
  return [...demandas].sort((uma, outra) => {
    if (uma.completa !== outra.completa) {
      return uma.completa ? -1 : 1;
    }

    if (uma.completa && outra.completa) {
      const diferenca = (outra.score ?? 0) - (uma.score ?? 0);

      if (diferenca !== 0) {
        return diferenca;
      }
    }

    return outra.id - uma.id;
  });
}

export const COLUNAS_ORDENAVEIS = [
  'id',
  'titulo',
  'tipo',
  'estado',
  'pontuacaoValor',
  'posicaoEsforco',
  'score',
] as const;

export type ColunaOrdenavel = (typeof COLUNAS_ORDENAVEIS)[number];

export interface OrdenacaoRanking {
  coluna: ColunaOrdenavel;
  direcao: 'asc' | 'desc';
}

/** Primeiro clique já mostra o que interessa: nota alta primeiro, esforço curto primeiro. */
export const DIRECAO_INICIAL: Record<ColunaOrdenavel, 'asc' | 'desc'> = {
  id: 'desc',
  titulo: 'asc',
  tipo: 'asc',
  estado: 'asc',
  pontuacaoValor: 'desc',
  posicaoEsforco: 'asc',
  score: 'desc',
};

function valorDaColuna(demanda: DemandaPriorizada, coluna: ColunaOrdenavel) {
  switch (coluna) {
    case 'id':
      return demanda.id;
    case 'titulo':
      return demanda.titulo;
    case 'tipo':
      return ROTULO_TIPO[demanda.tipo] ?? demanda.tipo;
    case 'estado':
      return demanda.estado;
    case 'pontuacaoValor':
      return demanda.pontuacaoValor;
    case 'posicaoEsforco':
      return demanda.posicaoEsforco;
    case 'score':
      return demanda.score;
  }
}

/** Sem ordenação escolhida vale a ordem do ranking. Demanda sem resposta cai sempre no fim. */
export function ordenarRanking(
  demandas: DemandaPriorizada[],
  ordenacao: OrdenacaoRanking | null,
) {
  if (!ordenacao) {
    return ordenarPorPrioridade(demandas);
  }

  const sinal = ordenacao.direcao === 'asc' ? 1 : -1;

  return [...demandas].sort((uma, outra) => {
    const daUma = valorDaColuna(uma, ordenacao.coluna);
    const daOutra = valorDaColuna(outra, ordenacao.coluna);

    if (daUma === null || daOutra === null) {
      if (daUma === daOutra) {
        return outra.id - uma.id;
      }

      return daUma === null ? 1 : -1;
    }

    const diferenca =
      typeof daUma === 'string' && typeof daOutra === 'string'
        ? daUma.localeCompare(String(daOutra), 'pt-BR')
        : Number(daUma) - Number(daOutra);

    return diferenca !== 0 ? diferenca * sinal : outra.id - uma.id;
  });
}

/** A posição do ranking não muda com filtro nem com ordenação da tabela. */
export function posicoesDoRanking(demandas: DemandaPriorizada[]) {
  const posicoes = new Map<number, number>();

  ordenarPorPrioridade(demandas)
    .filter((demanda) => demanda.completa)
    .forEach((demanda, indice) => posicoes.set(demanda.id, indice + 1));

  return posicoes;
}

/** Anda pela ordem do ranking, dando a volta, até achar outra demanda incompleta. */
export function proximaPendente(demandas: DemandaPriorizada[], idAtual: number) {
  const ordenadas = ordenarPorPrioridade(demandas);
  const atual = ordenadas.findIndex((demanda) => demanda.id === idAtual);

  for (let passo = 1; passo <= ordenadas.length; passo += 1) {
    const candidata = ordenadas[(atual + passo) % ordenadas.length];

    if (candidata && !candidata.completa && candidata.id !== idAtual) {
      return candidata.id;
    }
  }

  return null;
}
