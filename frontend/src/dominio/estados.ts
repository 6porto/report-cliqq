/**
 * Cor por `state::`. Os estados nascem no GitLab e mudam sem aviso, então a cor
 * sai de um hash do nome: mesmo estado cai sempre na mesma faixa da paleta e
 * estado novo já entra colorido. As cores vivem em `global.css` (light + dark).
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
] as const;

/** Issue sem label de estado não inventa cor: fica no cinza do tema. */
export const COR_SEM_ESTADO = 'var(--tinta-mutada)';

/** djb2: barato, estável entre sessões e bem distribuído para nomes curtos. */
function embaralhar(texto: string) {
  let soma = 5381;

  for (let posicao = 0; posicao < texto.length; posicao += 1) {
    soma = (soma * 33) ^ texto.charCodeAt(posicao);
  }

  return Math.abs(soma);
}

export function corDoEstado(estado: string | null | undefined) {
  if (!estado) {
    return COR_SEM_ESTADO;
  }

  return CORES_DOS_ESTADOS[embaralhar(estado.trim().toLowerCase()) % CORES_DOS_ESTADOS.length];
}

/** Rótulo legível do estado: `aguardando-release` vira `aguardando release`. */
export function rotuloDoEstado(estado: string | null | undefined) {
  return estado ? estado.replace(/-/g, ' ') : 'sem estado';
}
