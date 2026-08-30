/** Aceita `v_2.4.0-rc2`, `v2.4.0`, `2.3.0-rc1`. Tag fora desse formato é ignorada. */
const FORMATO_DA_TAG = /^v?_?(\d+)\.(\d+)\.(\d+)(?:-rc(\d+))?$/i;

/** Repositórios que versionam por aplicação, não por projeto: ficam sem geração de tag. */
export const REPOSITORIOS_SEM_VERSIONAMENTO = [
  'mercantil/kubernetes/dev-config',
  'mercantil/kubernetes/qas-config',
  'mercantil/kubernetes/prd-config',
];

export interface TagGitlab {
  name: string;
  commit?: { created_at?: string } | null;
}

export interface VersaoDaTag {
  major: number;
  minor: number;
  patch: number;
  rc: number;
}

export interface TagDeVersao {
  nome: string;
  minor: string;
  criadaEm: string | null;
}

export function ehRepositorioSemVersionamento(caminho: string) {
  return REPOSITORIOS_SEM_VERSIONAMENTO.includes(caminho);
}

export function interpretarTag(nome: string): VersaoDaTag | null {
  const partes = FORMATO_DA_TAG.exec(nome.trim());

  if (!partes) {
    return null;
  }

  return {
    major: Number(partes[1]),
    minor: Number(partes[2]),
    patch: Number(partes[3]),
    /** Tag final não tem rc; ela perde para a maior rc da mesma versão. */
    rc: partes[4] === undefined ? -1 : Number(partes[4]),
  };
}

function maisRecente(a: VersaoDaTag, b: VersaoDaTag) {
  return a.patch - b.patch || a.rc - b.rc;
}

/**
 * Uma tag por minor — a de maior patch e, dentro dela, o maior rc —, das três
 * minors mais altas do repositório.
 */
export function ultimasMinors(tags: TagGitlab[], quantidade = 3): TagDeVersao[] {
  const porMinor = new Map<string, { tag: TagGitlab; versao: VersaoDaTag }>();

  for (const tag of tags) {
    const versao = interpretarTag(tag.name);

    if (!versao) {
      continue;
    }

    const minor = `${versao.major}.${versao.minor}`;
    const atual = porMinor.get(minor);

    if (!atual || maisRecente(versao, atual.versao) > 0) {
      porMinor.set(minor, { tag, versao });
    }
  }

  return [...porMinor.entries()]
    .sort(([, a], [, b]) => b.versao.major - a.versao.major || b.versao.minor - a.versao.minor)
    .slice(0, quantidade)
    .map(([minor, { tag }]) => ({
      nome: tag.name,
      minor,
      criadaEm: tag.commit?.created_at ?? null,
    }));
}
