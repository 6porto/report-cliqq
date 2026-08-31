import type { IssueDaVersao } from '../api/tipos';

export type ColunaDeIssue =
  | 'id'
  | 'titulo'
  | 'tipos'
  | 'sistema'
  | 'autor'
  | 'estado'
  | 'responsavel'
  | 'situacao'
  | 'criadaEm';

export interface OrdenacaoDeIssues {
  coluna: ColunaDeIssue;
  direcao: 'asc' | 'desc';
}

export function valorDaColuna(issue: IssueDaVersao, coluna: ColunaDeIssue) {
  if (coluna === 'tipos') {
    return issue.tipos.join(', ');
  }

  const valor = issue[coluna];

  return valor === null ? '' : String(valor);
}

/**
 * Número e data comparam pelo próprio valor; o resto por texto. Vazio fica
 * sempre no fim, em qualquer direção, e o número da issue desempata.
 */
export function ordenarIssuesPor(issues: IssueDaVersao[], ordenacao: OrdenacaoDeIssues | null) {
  if (!ordenacao) {
    return issues;
  }

  const sinal = ordenacao.direcao === 'asc' ? 1 : -1;

  return [...issues].sort((a, b) => {
    if (ordenacao.coluna === 'id') {
      return (a.id - b.id) * sinal;
    }

    if (ordenacao.coluna === 'criadaEm') {
      return (a.criadaEm.localeCompare(b.criadaEm) || a.id - b.id) * sinal;
    }

    const valorA = valorDaColuna(a, ordenacao.coluna);
    const valorB = valorDaColuna(b, ordenacao.coluna);

    if (!valorA || !valorB) {
      return valorA ? -1 : valorB ? 1 : 0;
    }

    return (valorA.localeCompare(valorB, 'pt-BR') || a.id - b.id) * sinal;
  });
}

/** Valores distintos de uma coluna, para montar os filtros da tela. */
export function valoresDistintos(issues: IssueDaVersao[], coluna: 'estado' | 'sistema') {
  const valores = issues
    .map((issue) => issue[coluna])
    .filter((valor): valor is string => valor !== null && valor !== '');

  return [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function tiposDistintos(issues: IssueDaVersao[]) {
  return [...new Set(issues.flatMap((issue) => issue.tipos))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
}
