import type { Versao } from '../api/tipos';

/** Issues nesse estado entram na geração de uma nova versão. */
export const ESTADO_PRONTO_PARA_TAG = 'aguardando-release';

/** Espelha ESTADO_APOS_RELEASE do backend: para onde a issue vai depois da versão. */
export const ESTADO_APOS_RELEASE = 'aguardando-ambiente';

/** Espelha REPOSITORIOS_SEM_VERSIONAMENTO do backend: versionam por aplicação. */
export const REPOSITORIOS_SEM_VERSIONAMENTO = [
  'mercantil/kubernetes/dev-config',
  'mercantil/kubernetes/qas-config',
  'mercantil/kubernetes/prd-config',
];

export function ehRepositorioSemVersionamento(caminho: string) {
  return REPOSITORIOS_SEM_VERSIONAMENTO.includes(caminho);
}

export interface RepositorioComIssues {
  caminho: string;
  issues: number[];
}

/**
 * Repositórios ligados ao escolhido por issues em comum, em cadeia: liberar o
 * grupo inteiro é o que garante que nenhuma issue saia pela metade. Quem
 * versiona por aplicação fica fora do grafo, porque nunca gera tag.
 */
export function grupoDeRepositorios(
  repositorios: RepositorioComIssues[],
  caminho: string,
): string[] {
  const candidatos = repositorios.filter(
    (repositorio) => !ehRepositorioSemVersionamento(repositorio.caminho),
  );
  const inicial = candidatos.find((repositorio) => repositorio.caminho === caminho);

  if (!inicial) {
    return [];
  }

  const grupo = new Map<string, RepositorioComIssues>([[inicial.caminho, inicial]]);
  const fila = [inicial];

  while (fila.length > 0) {
    const atual = fila.pop()!;

    for (const outro of candidatos) {
      if (grupo.has(outro.caminho)) {
        continue;
      }

      if (outro.issues.some((id) => atual.issues.includes(id))) {
        grupo.set(outro.caminho, outro);
        fila.push(outro);
      }
    }
  }

  return [...grupo.keys()];
}

export type TipoDeVersao = 'fix' | 'release';

/** O prefixo da milestone separa correção de entrega — e é o que colore a tela. */
export function tipoDaVersao(titulo: string): TipoDeVersao {
  return titulo.trim().toLowerCase().startsWith('fix/') ? 'fix' : 'release';
}

export const ROTULO_TIPO_DE_VERSAO: Record<TipoDeVersao, string> = {
  fix: 'Correção',
  release: 'Entrega',
};

const VERSAO_NA_LINHA = /\bv?_?\d+\.\d+\.\d+(?:-rc\d+)?\b/i;
const PARTES_DA_TAG = /^v?_?(\d+)\.(\d+)\.(\d+)(?:-rc(\d+))?$/i;

function formatarData(valor: string | null) {
  return valor ? new Date(valor).toLocaleDateString('pt-BR') : '—';
}

export function periodoDaVersao(versao: Versao) {
  if (!versao.dataInicio && !versao.dataFim) {
    return 'sem período definido';
  }

  return `${formatarData(versao.dataInicio)} até ${formatarData(versao.dataFim)}`;
}

export type AcaoDeVersao = 'rc' | 'patch' | 'minor';

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

/** Corta o número no ponto em que a ação mexe: o começo não muda, o resto sim. */
export function dividirVersao(acao: AcaoDeVersao, versao: string) {
  const corte =
    acao === 'rc'
      ? /^(.*?)(rc\d+)$/i
      : acao === 'patch'
        ? /^(v?_?\d+\.\d+\.)(.*)$/i
        : /^(v?_?\d+\.)(.*)$/i;

  const partes = corte.exec(versao);

  return partes ? { base: partes[1], destaque: partes[2] } : { base: '', destaque: versao };
}

/**
 * Nova RC sobe o rc da própria tag; patch e minor partem da maior tag do
 * repositório e recomeçam em rc1. O nome sai sempre no formato `v_`.
 */
export function proximaVersao(acao: AcaoDeVersao, tagBase: string | null): string | null {
  const partes = tagBase ? PARTES_DA_TAG.exec(tagBase.trim()) : null;

  if (!partes) {
    return null;
  }

  const major = Number(partes[1]);
  const minor = Number(partes[2]);
  const patch = Number(partes[3]);
  const rc = partes[4] === undefined ? 0 : Number(partes[4]);

  if (acao === 'rc') {
    return `v_${major}.${minor}.${patch}-rc${rc + 1}`;
  }

  if (acao === 'patch') {
    return `v_${major}.${minor}.${patch + 1}-rc1`;
  }

  return `v_${major}.${minor + 1}.0-rc1`;
}
