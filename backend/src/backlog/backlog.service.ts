import { BadRequestException, Injectable } from '@nestjs/common';
import {
  inicioDoPeriodo,
  labelDaCriticidade,
  labelDoEsforco,
  labelsDeCriticidade,
  labelsDeEsforco,
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
   * Grava criticidade e esforço na issue. Remove os dois escopos inteiros antes
   * de aplicar os labels novos, então serve tanto para definir quanto para
   * trocar.
   */
  async definirCriticidade(iid: number, criticidade: Criticidade, esforco: number) {
    const doEsforco = labelDoEsforco(esforco);

    if (!doEsforco) {
      throw new BadRequestException(`Esforço fora da escala: ${esforco}`);
    }

    const escolhidos = [labelDaCriticidade(criticidade), doEsforco];
    const anteriores = [...labelsDeCriticidade(), ...labelsDeEsforco()].filter(
      (label) => !escolhidos.includes(label),
    );

    const issue = await this.gitlab.trocarLabelDaIssue<IssueDaVersaoGitlab>(
      iid,
      anteriores.join(','),
      escolhidos.join(','),
    );

    return { criticidade, esforco: doEsforco, issue: mapearIssueDaVersao(issue) };
  }
}
