import { Injectable } from '@nestjs/common';
import {
  inicioDoPeriodo,
  labelDaCriticidade,
  labelsDeCriticidade,
  ordenarPorCriacao,
  temCriticidade,
} from '../comum/backlog-gitlab';
import type { Criticidade } from '../comum/priorizacao';
import { mapearIssueDaVersao, mapearIssuesDaVersao, type IssueDaVersaoGitlab } from '../comum/versao-gitlab';
import { GitlabService } from '../gitlab/gitlab.service';

@Injectable()
export class BacklogService {
  constructor(private readonly gitlab: GitlabService) {}

  /**
   * Issues ainda abertas e sem `criticidade::` — o que passou pela triagem sem
   * receber prioridade. Sem `dias`, olha o backlog inteiro.
   */
  async listarSemCriticidade(dias: number | null) {
    const issues = await this.gitlab.listarIssuesAbertasDesde<IssueDaVersaoGitlab>(
      dias === null ? undefined : inicioDoPeriodo(dias),
    );

    const semCriticidade = issues.filter((issue) => !temCriticidade(issue.labels ?? []));

    return {
      dias,
      total: issues.length,
      issues: ordenarPorCriacao(mapearIssuesDaVersao(semCriticidade)),
    };
  }

  /**
   * Grava a criticidade na issue. Remove o escopo inteiro antes de aplicar o
   * novo label, então serve tanto para definir quanto para trocar.
   */
  async definirCriticidade(iid: number, criticidade: Criticidade) {
    const escolhido = labelDaCriticidade(criticidade);
    const anteriores = labelsDeCriticidade().filter((label) => label !== escolhido);

    const issue = await this.gitlab.trocarLabelDaIssue<IssueDaVersaoGitlab>(
      iid,
      anteriores.join(','),
      escolhido,
    );

    return { criticidade, issue: mapearIssueDaVersao(issue) };
  }
}
