export const ONDAS = [
  { nome: 'Onda 1', minimoOperacoes: 40 },
  { nome: 'Onda 2', minimoOperacoes: 20 },
  { nome: 'Onda 3', minimoOperacoes: 0 },
] as const;

export function ondaPorMediaDeOperacoes(mediaOperacoes90Dias: number) {
  return (
    ONDAS.find((onda) => mediaOperacoes90Dias >= onda.minimoOperacoes)?.nome ??
    ONDAS[ONDAS.length - 1].nome
  );
}
