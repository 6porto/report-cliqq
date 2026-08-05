export const CHAMADAS_POR_OPERACAO = 31;

export const ACRESCIMO_PEDIDOS_NAO_CONCLUIDOS = 0.5;

export function requisicoesDiarias(operacoes: number) {
  return Math.round(
    operacoes * CHAMADAS_POR_OPERACAO * (1 + ACRESCIMO_PEDIDOS_NAO_CONCLUIDOS),
  );
}
