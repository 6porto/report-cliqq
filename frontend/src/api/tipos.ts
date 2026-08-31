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

export interface LatenciaSemanal {
  id: number;
  /** Dia inicial da semana. */
  semana: string;
  /** Distribuição do tempo de resposta na semana, em % das requisições. */
  percentualAte1s: number | null;
  percentualAte3s: number | null;
  /** Requisições com erro na semana, em % do total. */
  percentualErros: number | null;
  /** Quantas requisições passaram de 3 segundos na semana. */
  requisicoesAcima3s: number | null;
}

export interface Melhoria {
  id: number;
  descricao: string;
  /** Dia previsto para subir; nulo enquanto não há data definida. */
  dataPrevista: string | null;
  subiuEmProducao: boolean;
  /** Momento em que foi marcada como no ar. */
  dataSubida: string | null;
}

export interface OperacoesEsperadas {
  pontos: { dia: string; operacoesEsperadas: number }[];
}

export interface MediaSemanal {
  id: number;
  /** Dia inicial da semana. */
  semana: string;
  /** Operações da semana em cada sistema; nulo enquanto não apuradas. */
  operacoesLegado: number | null;
  operacoesCentralizado: number | null;
  /** Operações que ficaram no legado apenas nas lojas do piloto. */
  pedidosLegadoPiloto: number | null;
  /** Bugs ainda em aberto ao fim da semana, por criticidade. */
  bugsAlta: number | null;
  bugsMedia: number | null;
  bugsBaixa: number | null;
  /** Anotação livre sobre os bugs da semana. */
  bugsDescricao: string | null;
}

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

export interface Versao {
  id: number;
  iid: number;
  grupoId: number | null;
  titulo: string;
  descricao: string | null;
  estado: string;
  dataInicio: string | null;
  dataFim: string | null;
  url: string;
}

export interface VersaoDeRepositorio {
  repositorio: string;
  nome: string;
  tag: string;
  urlTag: string;
  urlRelease: string;
  issues: number[];
}

export interface VersaoGerada {
  versoes: VersaoDeRepositorio[];
  milestone: string;
  urlMilestone: string;
  descricao: string;
  /** Estado para onde as issues da leva foram movidas. */
  estadoDasIssues: string;
  issues: number[];
}

export interface TagDeVersao {
  nome: string;
  minor: string;
  criadaEm: string | null;
}

export interface VersaoPronta extends Versao {
  issuesNoEstado: number;
}

export interface RepositorioDaVersao {
  caminho: string;
  nome: string;
  url: string;
  urlTags: string;
  tasks: number;
  abertas: number;
  fechadas: number;
  issues: number[];
}

export interface RepositoriosDaVersao {
  repositorios: RepositorioDaVersao[];
  issuesSemTask: number[];
}

export interface IssueDaVersao {
  id: number;
  titulo: string;
  tipos: string[];
  estado: string | null;
  sistema: string | null;
  responsavel: string | null;
  situacao: 'aberta' | 'fechada';
  url: string;
  criadaEm: string;
  atualizadaEm: string;
  fechadaEm: string | null;
}
