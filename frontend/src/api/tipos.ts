export type StatusRollout =
  | 'NAO_INICIADO'
  | 'EM_TREINAMENTO'
  | 'EM_ADAPTACAO'
  | 'EM_OPERACAO'
  | 'CONCLUIDO'
  | 'BLOQUEADO';

export interface Filial {
  id: number;
  codigo: string;
  cidade: string | null;
  uf: string | null;
  regional: string | null;
  onda: string | null;
  mediaOperacoes90Dias: number;
  status: StatusRollout;
  dataPrevista: string | null;
  dataInicio: string | null;
  dataConclusao: string | null;
  observacao: string | null;
}

export interface PaginaFiliais {
  itens: Filial[];
  total: number;
  pagina: number;
  tamanho: number;
}

export interface Resumo {
  total: number;
  concluidas: number;
  pendentes: number;
  percentualConcluido: number;
  atrasadas: number;
  concluidasUltimos7Dias: number;
  operacoesTotais: number;
  operacoesConcluidas: number;
  percentualOperacoesCobertas: number;
  porStatus: Record<StatusRollout, number>;
}

export interface PontoEvolucao {
  periodo: string;
  realizado: number;
  realizadoAcumulado: number;
  metaAcumulada: number | null;
}

export interface Evolucao {
  total: number;
  granularidade: 'semana' | 'mes';
  pontos: PontoEvolucao[];
}

export type DatasPorStatus = Record<StatusRollout, string | null>;

export type PontoStatusDia = {
  dia: string;
  total: number;
} & Record<StatusRollout, number>;

export interface StatusPorDia {
  total: number;
  pontos: PontoStatusDia[];
}

export type GrupoRollout = {
  nome: string;
  total: number;
  operacoes: number;
  percentualConcluido: number;
} & Record<StatusRollout, number>;

export interface CoberturaOnda {
  nome: string;
  lojas: number;
  lojasConcluidas: number;
  operacoes: number;
  operacoesAcumuladas: number;
  operacoesConcluidasAcumuladas: number;
  percentualDaRede: number;
  percentualPrevistoAcumulado: number;
  percentualRealizadoAcumulado: number;
}

export interface FaixaHoraria {
  hora: number;
  rotulo: string;
  percentualInformado: number;
  percentual: number;
  operacoesRedeCompleta: number;
  operacoesCobertas: number;
  operacoesPorMinuto: number;
  operacoesPorMinutoCobertas: number;
}

export interface DistribuicaoHoraria {
  operacoesTotais: number;
  operacoesCobertas: number;
  percentualInformado: number;
  horaDePico: string;
  operacoesNoPico: number;
  operacoesPorMinutoNoPico: number;
  horas: FaixaHoraria[];
}

export interface PontoProjecao {
  semana: number;
  lojasNaSemana: number;
  lojasAcumuladas: number;
  operacoesNaSemana: number;
  operacoesAcumuladas: number;
  percentualAcumulado: number;
}

export interface Projecao {
  crescimentoSemanal: number;
  operacoesTotais: number;
  totalDeLojas: number;
  semanasParaConcluir: number;
  pontos: PontoProjecao[];
}

export interface RespostaPriorizacao {
  beneficiados: number | null;
  tipoDeGanho: number | null;
  frequencia: number | null;
  riscoDeAdiar: number | null;
  esforco: number | null;
}

export interface DemandaPriorizada {
  id: number;
  titulo: string;
  tipo: string;
  estado: string | null;
  url: string;
  resposta: RespostaPriorizacao | null;
  completa: boolean;
  pontuacaoValor: number | null;
  pontuacaoEsforco: number | null;
  score: number | null;
  dias: number | null;
  posicaoEsforco: number | null;
  rotuloEsforco: string | null;
}

export interface ResumoSincronizacao {
  novas: number;
  atualizadas: number;
  sairam: number;
  total: number;
}

export const CAMPOS_ORDENAVEIS = [
  'codigo',
  'cidade',
  'uf',
  'onda',
  'mediaOperacoes90Dias',
  'status',
  'dataPrevista',
  'dataInicio',
  'dataConclusao',
] as const;

export type CampoOrdenavel = (typeof CAMPOS_ORDENAVEIS)[number];

export interface Ordenacao {
  campo: CampoOrdenavel;
  direcao: 'asc' | 'desc';
}

export interface FiltroFiliais {
  status?: StatusRollout;
  ordenarPor?: CampoOrdenavel;
  direcao?: 'asc' | 'desc';
  regional?: string;
  uf?: string;
  onda?: string;
  busca?: string;
  pagina?: number;
  tamanho?: number;
}

export interface Filtros {
  regionais: string[];
  ufs: string[];
  ondas: string[];
}
