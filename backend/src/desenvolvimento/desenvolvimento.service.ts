import { Injectable } from '@nestjs/common';
import {
  milestonesAbertas,
  montarMilestone,
  type MilestoneEmDesenvolvimento,
} from '../comum/desenvolvimento-gitlab';
import { mapearIssuesDaVersao } from '../comum/versao-gitlab';
import { GitlabService } from '../gitlab/gitlab.service';

@Injectable()
export class DesenvolvimentoService {
  constructor(private readonly gitlab: GitlabService) {}

  /**
   * Uma requisição só para a tela: as milestones abertas saem de uma chamada e
   * as issues de cada uma vêm em paralelo — são poucas milestones em andamento.
   */
  async listarMilestones(): Promise<MilestoneEmDesenvolvimento[]> {
    const versoes = milestonesAbertas(await this.gitlab.listarMilestones());

    return Promise.all(
      versoes.map(async (versao) => {
        const issues = mapearIssuesDaVersao(
          await this.gitlab.listarIssuesDaMilestone(versao.titulo),
        );

        return montarMilestone(versao, issues);
      }),
    );
  }
}
