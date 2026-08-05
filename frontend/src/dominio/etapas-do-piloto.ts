import type { StatusRollout } from '../api/tipos';

export interface EtapaDoPiloto {
  status: StatusRollout;
  duracaoEmDias: number;
  descricao: string;
  legado: string;
}

export const ETAPAS_DO_PILOTO: EtapaDoPiloto[] = [
  {
    status: 'EM_TREINAMENTO',
    duracaoEmDias: 1,
    descricao: 'A loja recebe o material de treinamento',
    legado: '—',
  },
  {
    status: 'EM_ADAPTACAO',
    duracaoEmDias: 2,
    descricao: 'A loja opera no CliQQ Centralizado',
    legado: 'Legado ainda ligado',
  },
  {
    status: 'EM_OPERACAO',
    duracaoEmDias: 2,
    descricao: 'A loja opera somente no CliQQ Centralizado',
    legado: 'Legado com as formas de pagamento desligadas',
  },
];

export const DURACAO_DO_PILOTO = ETAPAS_DO_PILOTO.reduce(
  (soma, etapa) => soma + etapa.duracaoEmDias,
  0,
);
