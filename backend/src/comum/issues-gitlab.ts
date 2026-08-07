export const PROJETO_DAS_ISSUES = 'mercantil/mercantil';
export const LABEL_DO_SISTEMA = 'system::cliqq-centralizado';

/** Ordem importa: issue marcada com os dois tipos entra como CRM. */
export const TIPOS_SINCRONIZADOS = ['crm', 'melhoria'] as const;

const PREFIXO_TIPO = 'type::';
const PREFIXO_ESTADO = 'state::';

export interface IssueGitlab {
  iid: number | string;
  title: string;
  labels: string[];
  web_url: string;
}

export interface DemandaSincronizada {
  id: number;
  titulo: string;
  tipo: string;
  estado: string | null;
  url: string;
}

export function tipoDaIssue(labels: string[]) {
  return TIPOS_SINCRONIZADOS.find((tipo) => labels.includes(`${PREFIXO_TIPO}${tipo}`)) ?? null;
}

export function estadoDaIssue(labels: string[]) {
  const label = labels.find((nome) => nome.startsWith(PREFIXO_ESTADO));

  return label ? label.slice(PREFIXO_ESTADO.length) : null;
}

export function mapearIssue(issue: IssueGitlab): DemandaSincronizada | null {
  const labels = issue.labels ?? [];
  const tipo = tipoDaIssue(labels);

  if (!tipo) {
    return null;
  }

  return {
    id: Number(issue.iid),
    titulo: issue.title,
    tipo,
    estado: estadoDaIssue(labels),
    url: issue.web_url,
  };
}

/** As buscas por tipo são separadas (a API só faz AND de labels), então há repetição. */
export function unirIssues(issues: IssueGitlab[]): DemandaSincronizada[] {
  const porId = new Map<number, DemandaSincronizada>();

  for (const issue of issues) {
    const demanda = mapearIssue(issue);

    if (demanda && !porId.has(demanda.id)) {
      porId.set(demanda.id, demanda);
    }
  }

  return [...porId.values()];
}

export interface ResumoSincronizacao {
  novas: number;
  atualizadas: number;
  sairam: number;
  total: number;
  idsQueSairam: number[];
}

export function resumirSincronizacao(
  conhecidas: { id: number; ativa: boolean }[],
  recebidas: DemandaSincronizada[],
): ResumoSincronizacao {
  const idsRecebidos = new Set(recebidas.map((demanda) => demanda.id));
  const idsConhecidos = new Set(conhecidas.map((demanda) => demanda.id));
  const idsQueSairam = conhecidas
    .filter((demanda) => demanda.ativa && !idsRecebidos.has(demanda.id))
    .map((demanda) => demanda.id);

  const novas = recebidas.filter((demanda) => !idsConhecidos.has(demanda.id)).length;

  return {
    novas,
    atualizadas: recebidas.length - novas,
    sairam: idsQueSairam.length,
    total: recebidas.length,
    idsQueSairam,
  };
}
