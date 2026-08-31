import { CRITICIDADES, type Criticidade } from './priorizacao';
import type { IssueDaVersao } from './versao-gitlab';

const PREFIXO_CRITICIDADE = 'criticidade::';

/** Períodos que a tela oferece; `null` traz o backlog inteiro. */
export const PERIODOS_EM_DIAS = [7, 15, 30] as const;

export function temCriticidade(labels: string[]) {
  return labels.some((label) => label.startsWith(PREFIXO_CRITICIDADE));
}

/**
 * Grafia exata do label do grupo `mercantil`, que o projeto herda. Nome que não
 * bate letra por letra faz o GitLab criar um label novo, só do projeto.
 */
export function labelDaCriticidade(criticidade: Criticidade) {
  return `${PREFIXO_CRITICIDADE}${criticidade}`;
}

/**
 * Escopo inteiro, para tirar a criticidade anterior seja ela qual for. A grafia
 * minúscula entra junto para recolher issue que tenha recebido essa variante.
 */
export function labelsDeCriticidade() {
  return CRITICIDADES.flatMap((criticidade) => [
    labelDaCriticidade(criticidade),
    `${PREFIXO_CRITICIDADE}${criticidade.toLowerCase()}`,
  ]);
}

/** Data limite no formato que o GitLab espera em `created_after`. */
export function inicioDoPeriodo(dias: number, agora = new Date()) {
  const inicio = new Date(agora);

  inicio.setDate(inicio.getDate() - dias);

  return inicio.toISOString();
}

/** Mais recentes primeiro: é o que ainda dá tempo de classificar. */
export function ordenarPorCriacao(issues: IssueDaVersao[]) {
  return [...issues].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm) || b.id - a.id);
}
