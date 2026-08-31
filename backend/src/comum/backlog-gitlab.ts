import { CRITICIDADES, type Criticidade } from './priorizacao';
import type { IssueDaVersao } from './versao-gitlab';

const PREFIXO_CRITICIDADE = 'criticidade::';

/** Períodos que a tela oferece; `null` traz o backlog inteiro. */
export const PERIODOS_EM_DIAS = [7, 15, 30] as const;

export function temCriticidade(labels: string[]) {
  return labels.some((label) => label.startsWith(PREFIXO_CRITICIDADE));
}

export function labelDaCriticidade(criticidade: Criticidade) {
  return `${PREFIXO_CRITICIDADE}${criticidade.toLowerCase()}`;
}

/**
 * Escopo inteiro, para tirar a criticidade anterior seja ela qual for. Vai nas
 * duas grafias: as issues antigas foram marcadas com `P` maiúsculo e o label
 * novo é minúsculo, então remover só uma delas deixaria as duas na issue.
 */
export function labelsDeCriticidade() {
  return CRITICIDADES.flatMap((criticidade) => [
    labelDaCriticidade(criticidade),
    `${PREFIXO_CRITICIDADE}${criticidade}`,
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
