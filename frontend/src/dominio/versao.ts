import type { IssueDaVersao, Versao } from '../api/tipos';

/** Espelha PREFIXOS_DE_VERSAO do backend (backend/src/comum/versao-gitlab.ts). */
export const PREFIXOS_DE_VERSAO = ['release/', 'fix/'] as const;

/** Espelha REPOSITORIOS_SEM_VERSIONAMENTO do backend (backend/src/comum/tags-gitlab.ts). */
export const REPOSITORIOS_SEM_VERSIONAMENTO = [
  'mercantil/kubernetes/dev-config',
  'mercantil/kubernetes/qas-config',
  'mercantil/kubernetes/prd-config',
];

export function ehRepositorioSemVersionamento(caminho: string) {
  return REPOSITORIOS_SEM_VERSIONAMENTO.includes(caminho);
}

/** Issues nesse estado já entram marcadas na geração de tag. */
export const ESTADO_PRONTO_PARA_TAG = 'aguardando-release';

export const COLUNAS_ORDENAVEIS = [
  'id',
  'titulo',
  'tipos',
  'estado',
  'sistema',
  'responsavel',
  'situacao',
  'atualizadaEm',
] as const;

export type ColunaIssue = (typeof COLUNAS_ORDENAVEIS)[number];

export interface OrdenacaoIssues {
  coluna: ColunaIssue;
  direcao: 'asc' | 'desc';
}

export const ORDENACAO_PADRAO: OrdenacaoIssues = { coluna: 'id', direcao: 'asc' };

export const DIRECAO_INICIAL: Record<ColunaIssue, 'asc' | 'desc'> = {
  id: 'asc',
  titulo: 'asc',
  tipos: 'asc',
  estado: 'asc',
  sistema: 'asc',
  responsavel: 'asc',
  situacao: 'asc',
  atualizadaEm: 'desc',
};

export const ROTULO_ORDENACAO: Record<ColunaIssue, string> = {
  id: 'Número da issue',
  titulo: 'Título',
  tipos: 'Tipo',
  estado: 'Estado',
  sistema: 'Sistema',
  responsavel: 'Responsável',
  situacao: 'Situação',
  atualizadaEm: 'Última atualização',
};

export type FiltroSituacao = 'todas' | 'aberta' | 'fechada';

export interface FiltrosDeIssues {
  situacao: FiltroSituacao;
  sistema: string;
  tipo: string;
  busca: string;
}

export const FILTROS_INICIAIS: FiltrosDeIssues = {
  situacao: 'todas',
  sistema: '',
  tipo: '',
  busca: '',
};

export const ROTULO_SITUACAO: Record<IssueDaVersao['situacao'], string> = {
  aberta: 'Aberta',
  fechada: 'Fechada',
};

export const ROTULO_ESTADO_VERSAO: Record<string, string> = {
  active: 'Ativa',
  closed: 'Fechada',
};

export function ehVersaoAtiva(versao: Versao) {
  return versao.estado !== 'closed';
}

export function formatarData(valor: string | null) {
  return valor ? new Date(valor).toLocaleDateString('pt-BR') : '—';
}

export function periodoDaVersao(versao: Versao) {
  if (!versao.dataInicio && !versao.dataFim) {
    return 'sem período definido';
  }

  return `${formatarData(versao.dataInicio)} até ${formatarData(versao.dataFim)}`;
}

export function sistemasDistintos(issues: IssueDaVersao[]): string[] {
  const sistemas = issues
    .map((issue) => issue.sistema)
    .filter((valor): valor is string => !!valor);

  return [...new Set(sistemas)].sort();
}

export function tiposDistintos(issues: IssueDaVersao[]): string[] {
  return [...new Set(issues.flatMap((issue) => issue.tipos))].sort();
}

export function filtrarIssues(issues: IssueDaVersao[], filtros: FiltrosDeIssues) {
  const busca = filtros.busca.trim().toLowerCase();

  return issues.filter((issue) => {
    if (filtros.situacao !== 'todas' && issue.situacao !== filtros.situacao) {
      return false;
    }

    if (filtros.sistema && issue.sistema !== filtros.sistema) {
      return false;
    }

    if (filtros.tipo && !issue.tipos.includes(filtros.tipo)) {
      return false;
    }

    if (busca && !`#${issue.id} ${issue.titulo}`.toLowerCase().includes(busca)) {
      return false;
    }

    return true;
  });
}

/** Vazio sempre no fim, independentemente da direção, para não poluir o topo da tabela. */
function comparar(a: IssueDaVersao, b: IssueDaVersao, coluna: ColunaIssue) {
  if (coluna === 'id') {
    return a.id - b.id;
  }

  const valorA = coluna === 'tipos' ? a.tipos.join(', ') : (a[coluna] ?? '');
  const valorB = coluna === 'tipos' ? b.tipos.join(', ') : (b[coluna] ?? '');

  if (!valorA || !valorB) {
    return valorA ? -1 : valorB ? 1 : 0;
  }

  return valorA.localeCompare(valorB, 'pt-BR');
}

export function ordenarIssues(issues: IssueDaVersao[], ordenacao: OrdenacaoIssues) {
  const sinal = ordenacao.direcao === 'asc' ? 1 : -1;

  return [...issues].sort((a, b) => {
    const diferenca = comparar(a, b, ordenacao.coluna);

    return diferenca === 0 ? a.id - b.id : diferenca * sinal;
  });
}
