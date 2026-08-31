import { interpretarTag } from './tags-gitlab';
import type { IssueDaVersao } from './versao-gitlab';

export interface ReleaseGitlab {
  tag_name: string;
  description: string | null;
}

const MARCADOR_DE_NOVO = '(novo)';
const VAZIO = '- N/A';

/** Ordem e títulos do documento de release, como o time já usa no GitLab. */
export const SECOES = [
  { chave: 'features', titulo: '## :gear: Features' },
  { chave: 'bugs', titulo: '## :tools: Bug fixes' },
  { chave: 'performance', titulo: '## :rocket: Performance' },
  { chave: 'tecnicos', titulo: '## :game_die: Cards Técnicos' },
  { chave: 'notes', titulo: '## :notepad_spiral: Notes' },
  { chave: 'dependencias', titulo: '## :package: Dependências' },
  { chave: 'scripts', titulo: '## :scroll: Scripts' },
  { chave: 'arquivos', titulo: '## :flag_black: Arquivos' },
  { chave: 'its', titulo: '## :notebook: ITs' },
] as const;

export type ChaveDaSecao = (typeof SECOES)[number]['chave'];

const SECAO_POR_TIPO: Record<string, ChaveDaSecao> = {
  crm: 'features',
  melhoria: 'features',
  bug: 'bugs',
  performance: 'performance',
  refactor: 'tecnicos',
};

/** Tipo fora do mapa — ou issue sem type:: — entra como card técnico. */
export function secaoDaIssue(tipos: string[]): ChaveDaSecao {
  for (const tipo of tipos) {
    const secao = SECAO_POR_TIPO[tipo];

    if (secao) {
      return secao;
    }
  }

  return 'tecnicos';
}

/**
 * A base do documento é o release da RC anterior — mesmo major.minor.patch,
 * maior rc abaixo do que está sendo gerado. Minor ou patch novos começam do zero.
 */
export function releaseAnterior(
  releases: ReleaseGitlab[],
  tagNova: string,
): ReleaseGitlab | null {
  const nova = interpretarTag(tagNova);

  if (!nova) {
    return null;
  }

  const candidatos = releases
    .map((release) => ({ release, versao: interpretarTag(release.tag_name) }))
    .filter(
      (item) =>
        item.versao !== null &&
        item.versao.major === nova.major &&
        item.versao.minor === nova.minor &&
        item.versao.patch === nova.patch &&
        item.versao.rc < nova.rc,
    )
    .sort((a, b) => b.versao!.rc - a.versao!.rc);

  return candidatos[0]?.release ?? null;
}

export function linhaDaIssue(issue: IssueDaVersao) {
  return `- ${issue.titulo} - ${issue.url}`;
}

const MARCADOR_NO_FIM = /\s*\(novo\)\s*$/i;

function semMarcador(linha: string) {
  return linha.replace(MARCADOR_NO_FIM, '').trimEnd();
}

/** Quebra o documento anterior em seções, descartando placeholders e marcadores. */
export function lerDescricao(descricao: string | null): Map<ChaveDaSecao, string[]> {
  const porSecao = new Map<ChaveDaSecao, string[]>(SECOES.map((secao) => [secao.chave, []]));
  let atual: ChaveDaSecao | null = null;

  for (const linha of (descricao ?? '').split(/\r?\n/)) {
    const cabecalho = SECOES.find((secao) => linha.trim() === secao.titulo);

    if (cabecalho) {
      atual = cabecalho.chave;
      continue;
    }

    const conteudo = linha.trim();

    if (!atual || conteudo === '' || /^[-*]\s*N\/?A$/i.test(conteudo)) {
      continue;
    }

    porSecao.get(atual)?.push(semMarcador(conteudo));
  }

  return porSecao;
}

/**
 * Herda o documento da RC anterior e marca com `(novo)` o que entra agora —
 * seja uma linha inédita ou uma que já estava lá e voltou a fazer parte.
 */
export function montarDescricaoDoRelease(
  anterior: string | null,
  issues: IssueDaVersao[],
): string {
  const porSecao = lerDescricao(anterior);

  for (const issue of issues) {
    const secao = secaoDaIssue(issue.tipos);
    const linhas = porSecao.get(secao) ?? [];
    const linha = linhaDaIssue(issue);
    const existente = linhas.findIndex((atual) => semMarcador(atual) === linha);

    if (existente >= 0) {
      linhas[existente] = `${linha} ${MARCADOR_DE_NOVO}`;
    } else {
      linhas.push(`${linha} ${MARCADOR_DE_NOVO}`);
    }

    porSecao.set(secao, linhas);
  }

  return SECOES.map((secao) => {
    const linhas = porSecao.get(secao.chave) ?? [];

    return `${secao.titulo}\n\n${linhas.length > 0 ? linhas.join('\n') : VAZIO}`;
  }).join('\n\n');
}
