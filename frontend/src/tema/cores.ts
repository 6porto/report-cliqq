import type { StatusRollout } from '../api/tipos';

export const ROTULO_STATUS: Record<StatusRollout, string> = {
  CONCLUIDO: 'Concluído',
  EM_OPERACAO: 'Em operação',
  EM_ADAPTACAO: 'Em adaptação',
  EM_TREINAMENTO: 'Em treinamento',
  NAO_INICIADO: 'Não iniciado',
  BLOQUEADO: 'Bloqueado',
};

export const ICONE_STATUS: Record<StatusRollout, string> = {
  CONCLUIDO: '✓',
  EM_OPERACAO: '◕',
  EM_ADAPTACAO: '◑',
  EM_TREINAMENTO: '◔',
  NAO_INICIADO: '○',
  BLOQUEADO: '!',
};

export const COR_STATUS: Record<StatusRollout, string> = {
  CONCLUIDO: 'var(--status-bom)',
  EM_OPERACAO: 'var(--serie-1)',
  EM_ADAPTACAO: 'var(--status-atencao)',
  EM_TREINAMENTO: 'var(--serie-violeta)',
  NAO_INICIADO: 'var(--neutro)',
  BLOQUEADO: 'var(--status-critico)',
};

export const ORDEM_PILHA_STATUS: StatusRollout[] = [
  'CONCLUIDO',
  'EM_OPERACAO',
  'EM_ADAPTACAO',
  'EM_TREINAMENTO',
  'NAO_INICIADO',
  'BLOQUEADO',
];

export const STATUS_EM_IMPLANTACAO: StatusRollout[] = [
  'EM_TREINAMENTO',
  'EM_ADAPTACAO',
  'EM_OPERACAO',
];
