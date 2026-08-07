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
] as const;

export const CRITERIO_DE_ESFORCO = {
  chave: 'esforco',
  pergunta: 'Qual o esforço estimado para o desenvolvimento?',
  opcoes: [
    { pontos: 20, rotulo: 'Alguns dias' },
    { pontos: 10, rotulo: '1 semana ou mais' },
    { pontos: 5, rotulo: '1 mês ou mais' },
  ],
} as const;

export type CampoResposta = keyof RespostaPriorizacao;

export interface Pergunta {
  chave: CampoResposta;
  pergunta: string;
  opcoes: readonly { pontos: number; rotulo: string }[];
}

export const PERGUNTAS: Pergunta[] = [...CRITERIOS_DE_VALOR, CRITERIO_DE_ESFORCO];

/** Eixo X do gráfico: tempo de desenvolvimento crescendo da esquerda para a direita. */
export const POSICOES_DE_ESFORCO = ['Alguns dias', '1 semana ou mais', '1 mês ou mais'];

export const PONTUACAO_VALOR_MINIMA = CRITERIOS_DE_VALOR.length * 5;
export const PONTUACAO_VALOR_MAXIMA = CRITERIOS_DE_VALOR.length * 20;
export const CORTE_GANHO_RAPIDO = (PONTUACAO_VALOR_MINIMA + PONTUACAO_VALOR_MAXIMA) / 2;

export function ehGanhoRapido(demanda: DemandaPriorizada) {
  return (
    demanda.completa &&
    (demanda.pontuacaoValor ?? 0) >= CORTE_GANHO_RAPIDO &&
    demanda.posicaoEsforco === 0
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
