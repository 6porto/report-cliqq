import { Injectable } from '@nestjs/common';
import { filtrarVersoes, mapearIssuesDaVersao } from '../comum/versao-gitlab';
import { GitlabService } from '../gitlab/gitlab.service';

@Injectable()
export class VersaoService {
  constructor(private readonly gitlab: GitlabService) {}

  async listarVersoes() {
    return filtrarVersoes(await this.gitlab.listarMilestones());
  }

  async listarIssues(milestoneId: number) {
    return mapearIssuesDaVersao(await this.gitlab.listarIssuesDaMilestone(milestoneId));
  }
}
