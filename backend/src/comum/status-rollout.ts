export const STATUS_ROLLOUT = [
  'NAO_INICIADO',
  'EM_TREINAMENTO',
  'EM_ADAPTACAO',
  'EM_OPERACAO',
  'CONCLUIDO',
  'BLOQUEADO',
] as const;

export type StatusRollout = (typeof STATUS_ROLLOUT)[number];

export const ROTULO_STATUS: Record<StatusRollout, string> = {
  NAO_INICIADO: 'Não iniciado',
  EM_TREINAMENTO: 'Em treinamento',
  EM_ADAPTACAO: 'Em adaptação',
  EM_OPERACAO: 'Em operação',
  CONCLUIDO: 'Concluído',
  BLOQUEADO: 'Bloqueado',
};

export const STATUS_CONCLUIDO: StatusRollout = 'CONCLUIDO';

export const STATUS_EM_IMPLANTACAO: StatusRollout[] = [
  'EM_TREINAMENTO',
  'EM_ADAPTACAO',
  'EM_OPERACAO',
];

/** Lojas com o CliQQ Centralizado já ligado, mesmo que o legado siga ativo. */
export const STATUS_COM_CENTRALIZADO: StatusRollout[] = [
  'EM_ADAPTACAO',
  'EM_OPERACAO',
  'CONCLUIDO',
];
