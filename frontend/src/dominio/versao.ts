import type { IssueDaVersao, Versao } from '../api/tipos';

/** Espelha PREFIXOS_DE_VERSAO do backend (backend/src/comum/versao-gitlab.ts). */
export const PREFIXOS_DE_VERSAO = ['release/', 'fix/'] as const;

/** Espelha REPOSITORIOS_SEM_VERSIONAMENTO do backend (backend/src/comum/tags-gitlab.ts). */
export const REPOSITORIOS_SEM_VERSIONAMENTO = [
  'mercantil/kubernetes/dev-config',
  'mercantil/kubernetes/qas-config',
  'mercantil/kubernetes/prd-config',
];

export const ROTULO_SITUACAO: Record<IssueDaVersao['situacao'], string> = {
  aberta: 'Aberta',
  fechada: 'Fechada',
};

export function ehVersaoAtiva(versao: Versao) {
  return versao.estado !== 'closed';
}

export function ehRepositorioSemVersionamento(caminho: string) {
  return REPOSITORIOS_SEM_VERSIONAMENTO.includes(caminho);
}

/** Issues nesse estado já entram marcadas na geração de tag. */
export const ESTADO_PRONTO_PARA_TAG = 'aguardando-release';

const VERSAO_NA_LINHA = /\bv?_?\d+\.\d+\.\d+(?:-rc\d+)?\b/i;

export type AcaoDeVersao = 'rc' | 'patch' | 'minor';

export const ROTULO_ACAO: Record<AcaoDeVersao, string> = {
  rc: 'Nova RC',
  patch: 'Nova patch',
  minor: 'Nova minor',
};

export interface VersaoNaDescricao {
  tag: string | null;
  acao: AcaoDeVersao | null;
  /** Repositório citado na descrição, mas sem nenhuma versão legível na linha. */
  malformada: boolean;
}

/**
 * Procura na descrição da milestone a linha do repositório e a tag dela.
 * Achou a tag: parte-se dessa versão (nova RC). Não achou o repositório: a
 * milestone decide — fix/ abre patch, release/ abre minor.
 */
export function versaoNaDescricao(
  descricao: string | null,
  nomeDoRepositorio: string,
  tituloDaMilestone: string,
): VersaoNaDescricao {
  const procurado = nomeDoRepositorio.toLowerCase();
  const linha = (descricao ?? '')
    .split(/\r?\n/)
    .find((texto) => texto.toLowerCase().includes(procurado));

  if (linha === undefined) {
    const ehCorrecao = tituloDaMilestone.trim().toLowerCase().startsWith('fix/');

    return { tag: null, acao: ehCorrecao ? 'patch' : 'minor', malformada: false };
  }

  const encontrada = VERSAO_NA_LINHA.exec(linha);

  if (!encontrada) {
    return { tag: null, acao: null, malformada: true };
  }

  return { tag: encontrada[0], acao: 'rc', malformada: false };
}
