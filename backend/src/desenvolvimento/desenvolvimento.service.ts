import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  /** Fechar só é permitido com a milestone inteira concluída: a tela oferece, aqui se confere. */
  async fecharMilestone(milestoneId: number) {
    const milestone = (await this.listarMilestones()).find(
      (candidata) => candidata.id === milestoneId,
    );

    if (!milestone) {
      throw new NotFoundException(`Milestone ${milestoneId} não está aberta`);
    }

    if (milestone.total === 0 || milestone.abertas > 0) {
      throw new ConflictException(
        `${milestone.titulo} ainda tem ${milestone.abertas} de ${milestone.total} issues abertas`,
      );
    }

    const fechada = await this.gitlab.fecharMilestone(milestone.id, milestone.grupoId);

    return { id: milestone.id, titulo: milestone.titulo, estado: fechada.state };
  }
}
