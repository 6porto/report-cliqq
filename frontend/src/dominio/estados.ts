/**
 * Cor por `state::`. Os estados nascem no GitLab e mudam sem aviso, então a cor
 * não é fixa por nome: a tela junta os estados que apareceram, ordena e
 * distribui a paleta em sequência. Assim dois estados nunca dividem a mesma cor
 * enquanto couberem na paleta — que é o ponto de colorir. As cores vivem em
 * `global.css` (light + dark).
 */
const CORES_DOS_ESTADOS = [
  'var(--estado-1)',
  'var(--estado-2)',
  'var(--estado-3)',
  'var(--estado-4)',
  'var(--estado-5)',
  'var(--estado-6)',
  'var(--estado-7)',
  'var(--estado-8)',
  'var(--estado-9)',
  'var(--estado-10)',
] as const;

/** Issue sem label de estado não inventa cor: fica no cinza do tema. */
export const COR_SEM_ESTADO = 'var(--tinta-mutada)';

export type PaletaDeEstados = Map<string, string>;

/**
 * Ordem alfabética, não a ordem em que a issue apareceu: a cor de um estado
 * não muda porque a milestone foi reordenada ou uma issue entrou na frente.
 */
export function montarPaletaDeEstados(estados: (string | null)[]): PaletaDeEstados {
  const presentes = [...new Set(estados.filter((estado): estado is string => Boolean(estado)))]
    .map((estado) => estado.trim())
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return new Map(
    presentes.map((estado, posicao) => [
      estado,
      CORES_DOS_ESTADOS[posicao % CORES_DOS_ESTADOS.length],
    ]),
  );
}

export function corDoEstado(paleta: PaletaDeEstados, estado: string | null | undefined) {
  return (estado && paleta.get(estado.trim())) || COR_SEM_ESTADO;
}

/** Rótulo legível do estado: `aguardando-release` vira `aguardando release`. */
export function rotuloDoEstado(estado: string | null | undefined) {
  return estado ? estado.replace(/-/g, ' ') : 'sem estado';
}
