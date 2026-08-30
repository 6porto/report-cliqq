import type { IssueDaVersao, Versao } from '../api/tipos';

/** Espelha PREFIXOS_DE_VERSAO do backend (backend/src/comum/versao-gitlab.ts). */
export const PREFIXOS_DE_VERSAO = ['feature/', 'fix/'] as const;

export const COLUNAS_ORDENAVEIS = [
  'id',
  'titulo',
  'tipo',
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
  tipo: 'asc',
  estado: 'asc',
  sistema: 'asc',
  responsavel: 'asc',
  situacao: 'asc',
  atualizadaEm: 'desc',
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

export function valoresDistintos(
  issues: IssueDaVersao[],
  campo: 'sistema' | 'tipo',
): string[] {
  return [...new Set(issues.map((issue) => issue[campo]).filter((valor): valor is string => !!valor))].sort();
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

    if (filtros.tipo && issue.tipo !== filtros.tipo) {
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

  const valorA = a[coluna] ?? '';
  const valorB = b[coluna] ?? '';

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
