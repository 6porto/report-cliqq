import { PROJETO_DAS_ISSUES } from './issues-gitlab';

export { PROJETO_DAS_ISSUES };

/** Só milestones cujo título começa com um destes prefixos entram na aba Versão. */
export const PREFIXOS_DE_VERSAO = ['feature/', 'fix/'] as const;

const PREFIXO_TIPO = 'type::';
const PREFIXO_ESTADO = 'state::';
const PREFIXO_SISTEMA = 'system::';

export interface MilestoneGitlab {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  state: string;
  start_date: string | null;
  due_date: string | null;
  web_url: string;
}

export interface Versao {
  id: number;
  iid: number;
  titulo: string;
  descricao: string | null;
  estado: string;
  dataInicio: string | null;
  dataFim: string | null;
  url: string;
}

export interface IssueDaVersaoGitlab {
  iid: number | string;
  title: string;
  state: string;
  labels: string[];
  web_url: string;
  assignee: { name?: string | null } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface IssueDaVersao {
  id: number;
  titulo: string;
  tipos: string[];
  estado: string | null;
  sistema: string | null;
  responsavel: string | null;
  situacao: 'aberta' | 'fechada';
  url: string;
  criadaEm: string;
  atualizadaEm: string;
  fechadaEm: string | null;
}

export function ehTituloDeVersao(titulo: string) {
  const normalizado = titulo.trim().toLowerCase();

  return PREFIXOS_DE_VERSAO.some((prefixo) => normalizado.startsWith(prefixo));
}

export function valorDoLabel(labels: string[], prefixo: string) {
  const label = labels.find((nome) => nome.startsWith(prefixo));

  return label ? label.slice(prefixo.length) : null;
}

/** Uma issue costuma carregar mais de um `type::` (bug + problemas-produção, por exemplo). */
export function valoresDoLabel(labels: string[], prefixo: string) {
  return labels
    .filter((nome) => nome.startsWith(prefixo))
    .map((nome) => nome.slice(prefixo.length))
    .sort();
}

export function mapearMilestone(milestone: MilestoneGitlab): Versao {
  return {
    id: milestone.id,
    iid: milestone.iid,
    titulo: milestone.title,
    descricao: milestone.description || null,
    estado: milestone.state,
    dataInicio: milestone.start_date,
    dataFim: milestone.due_date,
    url: milestone.web_url,
  };
}

/** Versões mais recentes primeiro; sem data de entrega vão para o fim. */
export function ordenarVersoes(versoes: Versao[]): Versao[] {
  return [...versoes].sort((a, b) => {
    if (a.dataFim !== b.dataFim) {
      if (!a.dataFim) return 1;
      if (!b.dataFim) return -1;

      return b.dataFim.localeCompare(a.dataFim);
    }

    return b.id - a.id;
  });
}

export function filtrarVersoes(milestones: MilestoneGitlab[]): Versao[] {
  return ordenarVersoes(
    milestones.filter((milestone) => ehTituloDeVersao(milestone.title)).map(mapearMilestone),
  );
}

export function mapearIssueDaVersao(issue: IssueDaVersaoGitlab): IssueDaVersao {
  const labels = issue.labels ?? [];

  return {
    id: Number(issue.iid),
    titulo: issue.title,
    tipos: valoresDoLabel(labels, PREFIXO_TIPO),
    estado: valorDoLabel(labels, PREFIXO_ESTADO),
    sistema: valorDoLabel(labels, PREFIXO_SISTEMA),
    responsavel: issue.assignee?.name || null,
    situacao: issue.state === 'closed' ? 'fechada' : 'aberta',
    url: issue.web_url,
    criadaEm: issue.created_at,
    atualizadaEm: issue.updated_at,
    fechadaEm: issue.closed_at,
  };
}

export function mapearIssuesDaVersao(issues: IssueDaVersaoGitlab[]): IssueDaVersao[] {
  return issues.map(mapearIssueDaVersao).sort((a, b) => a.id - b.id);
}
