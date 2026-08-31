import {
  ehTituloDeVersao,
  mapearMilestone,
  ordenarVersoes,
  type IssueDaVersao,
  type MilestoneGitlab,
  type Versao,
} from './versao-gitlab';

/** Estado da milestone no GitLab enquanto ela ainda está em andamento. */
const MILESTONE_ATIVA = 'active';

/** Linha da descrição no formato `- nome [tag](url)`; a url é opcional. */
const LINHA_DO_REPOSITORIO = /^\s*[-*]\s*(.+?)\s*\[([^\]]+)\]\(([^)]+)\)\s*$/;
const LINHA_SEM_LINK = /^\s*[-*]\s*(.+?)\s+(v?_?\d+\.\d+\.\d+(?:-rc\d+)?)\s*$/i;

export interface TagDaMilestone {
  repositorio: string;
  tag: string;
  url: string | null;
}

export interface MilestoneEmDesenvolvimento extends Versao {
  total: number;
  abertas: number;
  fechadas: number;
  /** Versões já geradas, lidas da descrição da milestone — sem consulta extra. */
  tags: TagDaMilestone[];
  issues: IssueDaVersao[];
}

/**
 * A aba Desenvolvimento só olha para o que está em andamento: milestone `fix/`
 * ou `release/` que ainda não foi encerrada no GitLab.
 */
export function milestonesAbertas(milestones: MilestoneGitlab[]): Versao[] {
  return ordenarVersoes(
    milestones
      .filter(
        (milestone) =>
          milestone.state === MILESTONE_ATIVA && ehTituloDeVersao(milestone.title),
      )
      .map(mapearMilestone),
  );
}

/**
 * Lê as linhas que a geração de versão grava na descrição da milestone
 * (`atualizarLinhaDoRepositorio`). Linha que não casa é texto solto e é ignorada.
 */
export function tagsDaDescricao(descricao: string | null): TagDaMilestone[] {
  const tags: TagDaMilestone[] = [];

  for (const linha of (descricao ?? '').split(/\r?\n/)) {
    const comLink = LINHA_DO_REPOSITORIO.exec(linha);

    if (comLink) {
      tags.push({ repositorio: comLink[1], tag: comLink[2], url: comLink[3] });
      continue;
    }

    const semLink = LINHA_SEM_LINK.exec(linha);

    if (semLink) {
      tags.push({ repositorio: semLink[1], tag: semLink[2], url: null });
    }
  }

  return tags;
}

export function montarMilestone(
  versao: Versao,
  issues: IssueDaVersao[],
): MilestoneEmDesenvolvimento {
  const fechadas = issues.filter((issue) => issue.situacao === 'fechada').length;

  return {
    ...versao,
    total: issues.length,
    abertas: issues.length - fechadas,
    fechadas,
    tags: tagsDaDescricao(versao.descricao),
    issues,
  };
}
