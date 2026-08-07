export const PONTOS_POSSIVEIS = [5, 10, 20] as const;

export type Pontos = (typeof PONTOS_POSSIVEIS)[number];

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

export type CriterioDeValor = (typeof CRITERIOS_DE_VALOR)[number]['chave'];

export const PERGUNTA_DE_ESFORCO = 'Qual o esforço estimado para o desenvolvimento?';

export const OPCOES_DE_ESFORCO = [
  { pontos: 20, rotulo: 'Alguns dias', dias: 3, posicao: 0 },
  { pontos: 10, rotulo: '1 semana ou mais', dias: 7, posicao: 1 },
  { pontos: 5, rotulo: '1 mês ou mais', dias: 30, posicao: 2 },
] as const;

export const PONTUACAO_VALOR_MINIMA = CRITERIOS_DE_VALOR.length * 5;
export const PONTUACAO_VALOR_MAXIMA = CRITERIOS_DE_VALOR.length * 20;
export const CORTE_GANHO_RAPIDO = (PONTUACAO_VALOR_MINIMA + PONTUACAO_VALOR_MAXIMA) / 2;

export interface RespostaPriorizacao {
  beneficiados: number | null;
  tipoDeGanho: number | null;
  frequencia: number | null;
  riscoDeAdiar: number | null;
  esforco: number | null;
}

export interface Priorizacao {
  completa: boolean;
  pontuacaoValor: number | null;
  pontuacaoEsforco: number | null;
  score: number | null;
  dias: number | null;
  posicaoEsforco: number | null;
  rotuloEsforco: string | null;
}

export function esforcoPorPontos(pontos: number | null) {
  return OPCOES_DE_ESFORCO.find((opcao) => opcao.pontos === pontos) ?? null;
}

export function calcularPriorizacao(resposta: RespostaPriorizacao | null): Priorizacao {
  const valores = CRITERIOS_DE_VALOR.map((criterio) => resposta?.[criterio.chave] ?? null).filter(
    (valor): valor is number => valor !== null,
  );
  const esforco = esforcoPorPontos(resposta?.esforco ?? null);

  if (valores.length < CRITERIOS_DE_VALOR.length || esforco === null) {
    return {
      completa: false,
      pontuacaoValor: null,
      pontuacaoEsforco: null,
      score: null,
      dias: null,
      posicaoEsforco: null,
      rotuloEsforco: esforco?.rotulo ?? null,
    };
  }

  const pontuacaoValor = valores.reduce((soma, valor) => soma + valor, 0);

  return {
    completa: true,
    pontuacaoValor,
    pontuacaoEsforco: esforco.pontos,
    score: pontuacaoValor + esforco.pontos,
    dias: esforco.dias,
    posicaoEsforco: esforco.posicao,
    rotuloEsforco: esforco.rotulo,
  };
}
