import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { atualizarLinhaDoRepositorio } from '../comum/descricao-milestone';
import { montarDescricaoDoRelease, releaseAnterior } from '../comum/release-gitlab';
import { GerarVersaoDto } from './dto/gerar-versao.dto';
import {
  agruparPorRepositorio,
  nomeReduzido,
  type RepositoriosDaVersao,
  type WorkItemDaIssue,
} from '../comum/repositorios-da-versao';
import { ehRepositorioSemVersionamento, ultimasMinors } from '../comum/tags-gitlab';
import {
  ESTADO_APOS_RELEASE,
  ESTADO_PRONTO_PARA_RELEASE,
  PREFIXO_ESTADO,
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
   * Libera um ou mais repositórios na mesma leva: cada um ganha tag e
   * lançamento, a milestone recebe todas as linhas de uma vez e as issues
   * avançam de estado no fim. Falha no meio para tudo — tag criada não volta
   * atrás, então o erro carrega o que já saiu.
   */
  async gerarVersao(dto: GerarVersaoDto) {
    const versao = (await this.listarVersoes()).find(
      (candidata) => candidata.titulo === dto.milestone,
    );

    if (!versao) {
      throw new NotFoundException(`Milestone ${dto.milestone} não encontrada`);
    }

    const todas = await this.listarIssues(dto.milestone);
    const base = this.gitlab.base().replace(/\/+$/, '');
    const geradas: {
      repositorio: string;
      nome: string;
      tag: string;
      urlTag: string;
      urlRelease: string;
      issues: number[];
    }[] = [];

    let descricao = versao.descricao;

    for (const alvo of dto.repositorios) {
      const issues = alvo.issues
        .map((id) => todas.find((issue) => issue.id === id))
        .filter((issue): issue is (typeof todas)[number] => issue !== undefined);

      const mensagem = [
        `Milestone: [${versao.titulo}](${versao.url})`,
        '',
        ...issues.map((issue) => `- [#${issue.id}](${issue.url}) ${issue.titulo}`),
      ].join('\n');

      try {
        const tag = await this.gitlab.criarTag(
          alvo.repositorio,
          alvo.tag,
          dto.milestone,
          mensagem,
        );

        const anterior = releaseAnterior(
          await this.gitlab.listarReleases(alvo.repositorio),
          tag.name,
        );

        await this.gitlab.criarRelease(
          alvo.repositorio,
          tag.name,
          montarDescricaoDoRelease(anterior?.description ?? null, issues),
          new Date().toISOString(),
        );

        const urlTag = `${base}/${alvo.repositorio}/-/tags/${encodeURIComponent(tag.name)}`;

        descricao = atualizarLinhaDoRepositorio(
          descricao,
          nomeReduzido(alvo.repositorio),
          tag.name,
          urlTag,
        );

        geradas.push({
          repositorio: alvo.repositorio,
          nome: nomeReduzido(alvo.repositorio),
          tag: tag.name,
          urlTag,
          urlRelease: `${base}/${alvo.repositorio}/-/releases/${encodeURIComponent(tag.name)}`,
          issues: issues.map((issue) => issue.id),
        });
      } catch (erro) {
        throw new ServiceUnavailableException({
          message: `Falhou em ${nomeReduzido(alvo.repositorio)}: ${mensagemDaFalha(erro)}`,
          geradas,
          faltou: dto.repositorios
            .slice(dto.repositorios.indexOf(alvo))
            .map((restante) => nomeReduzido(restante.repositorio)),
        });
      }
    }

    await this.gitlab.atualizarDescricaoDaMilestone(
      versao.id,
      versao.grupoId,
      descricao ?? '',
    );

    /* Por último: com tags, lançamentos e milestone no lugar, as issues avançam
       de estado. Uma issue em dois repositórios só é tocada uma vez. */
    const issuesDaLeva = [...new Set(dto.repositorios.flatMap((alvo) => alvo.issues))];

    for (const id of issuesDaLeva) {
      await this.gitlab.trocarLabelDaIssue(
        id,
        `${PREFIXO_ESTADO}${ESTADO_PRONTO_PARA_RELEASE}`,
        `${PREFIXO_ESTADO}${ESTADO_APOS_RELEASE}`,
      );
    }

    return {
      versoes: geradas,
      milestone: versao.titulo,
      urlMilestone: versao.url,
      descricao: descricao ?? '',
      estadoDasIssues: ESTADO_APOS_RELEASE,
      issues: issuesDaLeva,
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

/** O GitLab responde erro em formatos diferentes; aqui vira uma linha só. */
function mensagemDaFalha(erro: unknown) {
  if (erro instanceof ServiceUnavailableException) {
    const resposta = erro.getResponse();

    if (typeof resposta === 'string') {
      return resposta;
    }

    if (typeof resposta === 'object' && resposta !== null && 'message' in resposta) {
      return String((resposta as { message: unknown }).message);
    }
  }

  return erro instanceof Error ? erro.message : String(erro);
}
