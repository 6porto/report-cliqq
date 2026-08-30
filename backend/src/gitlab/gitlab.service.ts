import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PROJETO_DAS_ISSUES, type IssueGitlab } from '../comum/issues-gitlab';
import type { IssueDaVersaoGitlab, MilestoneGitlab } from '../comum/versao-gitlab';

const POR_PAGINA = 100;
const MAXIMO_DE_PAGINAS = 20;
const TEMPO_LIMITE = 20_000;

@Injectable()
export class GitlabService {
  constructor(private readonly config: ConfigService) {}

  async listarIssuesAbertas(labels: string[]): Promise<IssueGitlab[]> {
    return this.paginar<IssueGitlab>('issues', {
      state: 'opened',
      scope: 'all',
      labels: labels.join(','),
    });
  }

  /** Traz milestones abertas e fechadas: o filtro por estado é feito na tela. */
  async listarMilestones(): Promise<MilestoneGitlab[]> {
    return this.paginar<MilestoneGitlab>('milestones', { state: 'all' });
  }

  async listarIssuesDaMilestone(milestoneId: number): Promise<IssueDaVersaoGitlab[]> {
    return this.paginar<IssueDaVersaoGitlab>(`milestones/${milestoneId}/issues`, {});
  }

  private async paginar<T>(caminho: string, parametros: Record<string, string>): Promise<T[]> {
    const token = this.token();
    const base = this.config.get<string>('GITLAB_URL') ?? 'http://gitlab.queroquero.com.br';
    const projeto = encodeURIComponent(PROJETO_DAS_ISSUES);
    const itens: T[] = [];

    for (let pagina = 1; pagina <= MAXIMO_DE_PAGINAS; pagina += 1) {
      const busca = new URLSearchParams({
        ...parametros,
        per_page: String(POR_PAGINA),
        page: String(pagina),
      });

      const lote = await this.buscar<T>(
        `${base}/api/v4/projects/${projeto}/${caminho}?${busca}`,
        token,
      );
      itens.push(...lote);

      if (lote.length < POR_PAGINA) {
        break;
      }
    }

    return itens;
  }

  private token() {
    const token = this.config.get<string>('GITLAB_TOKEN');

    if (!token) {
      throw new ServiceUnavailableException(
        'GITLAB_TOKEN não configurado no backend. Gere um token com escopo read_api e coloque no .env.',
      );
    }

    return token;
  }

  private async buscar<T>(url: string, token: string): Promise<T[]> {
    let resposta: Response;

    try {
      resposta = await fetch(url, {
        headers: { 'PRIVATE-TOKEN': token },
        signal: AbortSignal.timeout(TEMPO_LIMITE),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível falar com o GitLab. Verifique a rede e a variável GITLAB_URL.',
      );
    }

    if (!resposta.ok) {
      throw new ServiceUnavailableException(
        `O GitLab respondeu ${resposta.status}. Verifique o token e o acesso ao projeto ${PROJETO_DAS_ISSUES}.`,
      );
    }

    return (await resposta.json()) as T[];
  }
}
