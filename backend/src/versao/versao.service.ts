import { Injectable } from '@nestjs/common';
import {
  agruparPorRepositorio,
  type RepositoriosDaVersao,
  type WorkItemDaIssue,
} from '../comum/repositorios-da-versao';
import { ehRepositorioSemVersionamento, ultimasMinors } from '../comum/tags-gitlab';
import { PROJETO_DAS_ISSUES, filtrarVersoes, mapearIssuesDaVersao } from '../comum/versao-gitlab';
import { GitlabService } from '../gitlab/gitlab.service';

const CONSULTA_DAS_TASKS = `
query($caminhoDoProjeto: ID!, $iids: [String!]) {
  project(fullPath: $caminhoDoProjeto) {
    workItems(iids: $iids) {
      nodes {
        iid
        widgets {
          ... on WorkItemWidgetHierarchy {
            children {
              nodes {
                iid
                title
                state
                webUrl
                workItemType { name }
                namespace { fullPath }
              }
            }
          }
        }
      }
    }
  }
}`;

interface RespostaDasTasks {
  project: { workItems: { nodes: WorkItemDaIssue[] } } | null;
}

@Injectable()
export class VersaoService {
  constructor(private readonly gitlab: GitlabService) {}

  async listarVersoes() {
    return filtrarVersoes(await this.gitlab.listarMilestones());
  }

  async listarIssues(milestone: string) {
    return mapearIssuesDaVersao(await this.gitlab.listarIssuesDaMilestone(milestone));
  }

  async listarTags(repositorio: string) {
    if (ehRepositorioSemVersionamento(repositorio)) {
      return [];
    }

    return ultimasMinors(await this.gitlab.listarTags(repositorio));
  }

  /** Os repositórios saem das tasks: cada task da issue vive no projeto onde o código muda. */
  async listarRepositorios(milestone: string): Promise<RepositoriosDaVersao> {
    const issues = await this.gitlab.listarIssuesDaMilestone(milestone);
    const iids = issues.map((issue) => String(issue.iid));

    if (iids.length === 0) {
      return { repositorios: [], issuesSemTask: [] };
    }

    const resposta = await this.gitlab.consultarGraphql<RespostaDasTasks>(CONSULTA_DAS_TASKS, {
      caminhoDoProjeto: PROJETO_DAS_ISSUES,
      iids,
    });

    return agruparPorRepositorio(
      resposta.project?.workItems?.nodes ?? [],
      this.gitlab.base(),
    );
  }
}
