export const ONDAS = ['Onda 1', 'Onda 2', 'Onda 3'];

export const REGRA_DAS_ONDAS =
  'Onda 1: 40+ operações/dia · Onda 2: 20 a 39 · Onda 3: menos de 20';

export const CRITERIO_DAS_ONDAS: { nome: string; faixa: string; motivo: string }[] = [
  {
    nome: 'Onda 1',
    faixa: '40 ou mais operações/dia',
    motivo: 'Maior volume: poucas lojas cobrem boa parte das operações da rede logo no início',
  },
  {
    nome: 'Onda 2',
    faixa: '20 a 39 operações/dia',
    motivo: 'Volume intermediário: entram depois que o CliQQ já rodou nas lojas grandes',
  },
  {
    nome: 'Onda 3',
    faixa: 'menos de 20 operações/dia',
    motivo: 'Cauda longa: muitas lojas com pouco volume, fecham o rollout',
  },
];

export const CRITERIO_SEM_ONDA = 'Onda atribuída manualmente, fora da regra por volume';
