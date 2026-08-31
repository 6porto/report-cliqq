export const PONTOS_DE_VALOR = [5, 10, 20] as const;

export type Pontos = (typeof PONTOS_DE_VALOR)[number];

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

export type CriterioDeValor = (typeof CRITERIOS_DE_VALOR)[number]['chave'];

export const PERGUNTA_DE_ESFORCO = 'Qual o esforço estimado para o desenvolvimento?';

/**
 * `dias` são dias úteis (5 por semana, 22 por mês) e alimentam o KPI de esforço.
 * `etiqueta` é o sufixo do label `esforco::` no GitLab e conta dias corridos —
 * é prazo de calendário, por isso 1 semana vira 7 e não 5.
 */
export const OPCOES_DE_ESFORCO = [
  { pontos: 20, rotulo: '1 dia', dias: 1, posicao: 0, etiqueta: '1' },
  { pontos: 17, rotulo: '2 dias', dias: 2, posicao: 1, etiqueta: '2' },
  { pontos: 14, rotulo: '1 semana', dias: 5, posicao: 2, etiqueta: '7' },
  { pontos: 11, rotulo: '2 semanas', dias: 10, posicao: 3, etiqueta: '14' },
  { pontos: 8, rotulo: '1 mês', dias: 22, posicao: 4, etiqueta: '30' },
  { pontos: 5, rotulo: '2 meses', dias: 44, posicao: 5, etiqueta: '60' },
  { pontos: 2, rotulo: 'mais de 2 meses', dias: 66, posicao: 6, etiqueta: '60+' },
] as const;

export const PONTOS_DE_ESFORCO = OPCOES_DE_ESFORCO.map((opcao) => opcao.pontos);

/** Ganho rápido: valor alto e esforço de até 2 dias. */
export const POSICAO_MAXIMA_DE_GANHO_RAPIDO = 1;

export const PONTUACAO_VALOR_MINIMA = CRITERIOS_DE_VALOR.length * 5;
export const PONTUACAO_VALOR_MAXIMA = CRITERIOS_DE_VALOR.length * 20;
export const CORTE_GANHO_RAPIDO = (PONTUACAO_VALOR_MINIMA + PONTUACAO_VALOR_MAXIMA) / 2;

export interface RespostaPriorizacao {
  beneficiados: number | null;
  tipoDeGanho: number | null;
  frequencia: number | null;
  riscoDeAdiar: number | null;
  contorno: number | null;
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

/**
 * Criticidade sugerida pela soma das cinco perguntas de valor (25 a 100) — o
 * esforço fica de fora: ele muda a ordem da fila, não a gravidade da demanda.
 * As faixas são contínuas porque toda resposta vale 5, 10 ou 20.
 */
export const FAIXAS_DE_CRITICIDADE = [
  { criticidade: 'P1', minimo: 85, maximo: 100, resumo: 'Pelo menos quatro respostas de 20' },
  { criticidade: 'P2', minimo: 65, maximo: 80, resumo: 'Predominância de respostas altas' },
  {
    criticidade: 'P3',
    minimo: 45,
    maximo: 60,
    resumo: 'Mistura com predominância de médias/baixas',
  },
  { criticidade: 'P4', minimo: 25, maximo: 40, resumo: 'Quase tudo na resposta mínima' },
] as const;

export type Criticidade = (typeof FAIXAS_DE_CRITICIDADE)[number]['criticidade'];

export const CRITICIDADES = FAIXAS_DE_CRITICIDADE.map((faixa) => faixa.criticidade);

export function sugerirCriticidade(pontuacaoValor: number | null): Criticidade | null {
  if (pontuacaoValor === null) {
    return null;
  }

  return FAIXAS_DE_CRITICIDADE.find((faixa) => pontuacaoValor >= faixa.minimo)?.criticidade ?? null;
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
