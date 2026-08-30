import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PROJETO_DAS_ISSUES, type IssueGitlab } from '../comum/issues-gitlab';
import type { ReleaseGitlab } from '../comum/release-gitlab';
import type { TagGitlab } from '../comum/tags-gitlab';
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

  /**
   * Traz milestones abertas e fechadas: o filtro por estado é feito na tela.
   * As versões ficam no grupo pai, não no projeto, daí o `include_parent_milestones`.
   */
  async listarMilestones(): Promise<MilestoneGitlab[]> {
    return this.paginar<MilestoneGitlab>('milestones', {
      state: 'all',
      include_parent_milestones: 'true',
    });
  }

  /**
   * A busca é pelo título porque `milestones/:id/issues` responde 404 para milestone
   * herdada do grupo — e é lá que as versões ficam.
   */
  async listarIssuesDaMilestone(titulo: string): Promise<IssueDaVersaoGitlab[]> {
    return this.paginar<IssueDaVersaoGitlab>('issues', {
      milestone: titulo,
      scope: 'all',
      state: 'all',
    });
  }

  /** Issues abertas com um label específico; cada uma já traz a milestone embutida. */
  async listarIssuesPorLabel<T>(label: string): Promise<T[]> {
    return this.paginar<T>('issues', { labels: label, state: 'opened', scope: 'all' });
  }

  async listarTags(caminhoDoProjeto: string): Promise<TagGitlab[]> {
    const token = this.token();
    const projeto = encodeURIComponent(caminhoDoProjeto);
    const tags: TagGitlab[] = [];

    for (let pagina = 1; pagina <= MAXIMO_DE_PAGINAS; pagina += 1) {
      const busca = new URLSearchParams({
        per_page: String(POR_PAGINA),
        page: String(pagina),
      });

      const lote = await this.buscar<TagGitlab>(
        `${this.base()}/api/v4/projects/${projeto}/repository/tags?${busca}`,
        token,
      );
      tags.push(...lote);

      if (lote.length < POR_PAGINA) {
        break;
      }
    }

    return tags;
  }

  async listarReleases(caminhoDoProjeto: string): Promise<ReleaseGitlab[]> {
    const projeto = encodeURIComponent(caminhoDoProjeto);
    const busca = new URLSearchParams({ per_page: String(POR_PAGINA) });

    return this.buscar<ReleaseGitlab>(
      `${this.base()}/api/v4/projects/${projeto}/releases?${busca}`,
      this.token(),
    );
  }

  async criarRelease(
    caminhoDoProjeto: string,
    tag: string,
    descricao: string,
    lancadoEm: string,
  ) {
    const projeto = encodeURIComponent(caminhoDoProjeto);
    const busca = new URLSearchParams({
      name: tag,
      tag_name: tag,
      description: descricao,
      released_at: lancadoEm,
    });

    return this.escrever<{ tag_name: string; _links?: { self?: string } }>(
      `${this.base()}/api/v4/projects/${projeto}/releases?${busca}`,
      'POST',
    );
  }

  async criarTag(caminhoDoProjeto: string, tag: string, ref: string, mensagem: string) {
    const projeto = encodeURIComponent(caminhoDoProjeto);
    const busca = new URLSearchParams({ tag_name: tag, ref, message: mensagem });

    return this.escrever<{ name: string }>(
      `${this.base()}/api/v4/projects/${projeto}/repository/tags?${busca}`,
      'POST',
    );
  }

  /** Milestone de grupo se edita pelo grupo; a do projeto, pelo projeto. */
  async atualizarDescricaoDaMilestone(
    milestoneId: number,
    grupoId: number | null,
    descricao: string,
  ) {
    const dono = grupoId
      ? `groups/${grupoId}`
      : `projects/${encodeURIComponent(PROJETO_DAS_ISSUES)}`;
    const busca = new URLSearchParams({ description: descricao });

    return this.escrever<{ description: string }>(
      `${this.base()}/api/v4/${dono}/milestones/${milestoneId}?${busca}`,
      'PUT',
    );
  }

  private async escrever<T>(url: string, metodo: 'POST' | 'PUT'): Promise<T> {
    const token = this.token();
    let resposta: Response;

    try {
      resposta = await fetch(url, {
        method: metodo,
        headers: { 'PRIVATE-TOKEN': token },
        signal: AbortSignal.timeout(TEMPO_LIMITE),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível falar com o GitLab. Verifique a rede e a variável GITLAB_URL.',
      );
    }

    const corpo: unknown = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      const mensagem =
        typeof corpo === 'object' && corpo !== null && 'message' in corpo
          ? JSON.stringify((corpo as { message: unknown }).message)
          : resposta.statusText;

      if (resposta.status === 401 || resposta.status === 403) {
        throw new ServiceUnavailableException(
          `O GitLab recusou a escrita (${resposta.status}). O GITLAB_TOKEN precisa do escopo api, não só read_api. Detalhe: ${mensagem}`,
        );
      }

      throw new ServiceUnavailableException(`O GitLab respondeu ${resposta.status}: ${mensagem}`);
    }

    return corpo as T;
  }

  /** A hierarquia de work items (as tasks dentro da issue) só existe no GraphQL. */
  async consultarGraphql<T>(query: string, variaveis: Record<string, unknown>): Promise<T> {
    const token = this.token();
    let resposta: Response;

    try {
      resposta = await fetch(`${this.base()}/api/graphql`, {
        method: 'POST',
        headers: { 'PRIVATE-TOKEN': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: variaveis }),
        signal: AbortSignal.timeout(TEMPO_LIMITE),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível falar com o GitLab. Verifique a rede e a variável GITLAB_URL.',
      );
    }

    if (!resposta.ok) {
      throw new ServiceUnavailableException(
        `O GitLab respondeu ${resposta.status} na consulta GraphQL. Verifique o token e o acesso ao projeto ${PROJETO_DAS_ISSUES}.`,
      );
    }

    const corpo = (await resposta.json()) as { data?: T; errors?: { message: string }[] };

    if (corpo.errors?.length) {
      throw new ServiceUnavailableException(
        `O GitLab recusou a consulta das tasks: ${corpo.errors.map((erro) => erro.message).join('; ')}`,
      );
    }

    return corpo.data as T;
  }

  base() {
    return this.config.get<string>('GITLAB_URL') ?? 'http://gitlab.queroquero.com.br';
  }

  private async paginar<T>(caminho: string, parametros: Record<string, string>): Promise<T[]> {
    const token = this.token();
    const base = this.base();
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
