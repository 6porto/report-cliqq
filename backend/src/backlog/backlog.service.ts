import { Injectable } from '@nestjs/common';
import { inicioDoPeriodo, ordenarPorCriacao, temCriticidade } from '../comum/backlog-gitlab';
import { mapearIssuesDaVersao, type IssueDaVersaoGitlab } from '../comum/versao-gitlab';
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
}
