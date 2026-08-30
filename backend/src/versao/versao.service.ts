import { Injectable, NotFoundException } from '@nestjs/common';
import { atualizarLinhaDoRepositorio } from '../comum/descricao-milestone';
import { GerarVersaoDto } from './dto/gerar-versao.dto';
import {
  agruparPorRepositorio,
  nomeReduzido,
  type RepositoriosDaVersao,
  type WorkItemDaIssue,
} from '../comum/repositorios-da-versao';
import { ehRepositorioSemVersionamento, ultimasMinors } from '../comum/tags-gitlab';
import {
  ESTADO_PRONTO_PARA_RELEASE,
  PROJETO_DAS_ISSUES,
  filtrarVersoes,
  mapearIssuesDaVersao,
  versoesProntas,
  type IssueComMilestone,
} from '../comum/versao-gitlab';
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

  /** Primeira etapa do wizard: versões com pelo menos uma issue pronta para release. */
  async listarVersoesProntas() {
    const issues = await this.gitlab.listarIssuesPorLabel<IssueComMilestone>(
      `state::${ESTADO_PRONTO_PARA_RELEASE}`,
    );

    return versoesProntas(issues);
  }

  async listarIssues(milestone: string) {
    return mapearIssuesDaVersao(await this.gitlab.listarIssuesDaMilestone(milestone));
  }

  /**
   * Cria a tag na branch homônima da milestone e registra o resultado na
   * descrição dela. A tag vem primeiro: sem ela não há o que anotar.
   */
  async gerarVersao(dto: GerarVersaoDto) {
    const versao = (await this.listarVersoes()).find(
      (candidata) => candidata.titulo === dto.milestone,
    );

    if (!versao) {
      throw new NotFoundException(`Milestone ${dto.milestone} não encontrada`);
    }

    const tag = await this.gitlab.criarTag(
      dto.repositorio,
      dto.tag,
      dto.milestone,
      dto.mensagem,
    );

    const descricao = atualizarLinhaDoRepositorio(
      versao.descricao,
      nomeReduzido(dto.repositorio),
      dto.tag,
    );

    await this.gitlab.atualizarDescricaoDaMilestone(versao.id, versao.grupoId, descricao);

    const base = this.gitlab.base().replace(/\/+$/, '');

    return {
      tag: tag.name,
      urlTag: `${base}/${dto.repositorio}/-/tags/${encodeURIComponent(tag.name)}`,
      milestone: versao.titulo,
      urlMilestone: versao.url,
      descricao,
    };
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
