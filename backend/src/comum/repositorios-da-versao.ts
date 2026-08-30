/** Tipos de work item que contam como task; o GitLab pode responder no idioma da instância. */
const TIPOS_DE_TASK = ['task', 'tarefa'];

export interface WorkItemFilho {
  iid: number | string;
  title: string;
  state: string;
  webUrl: string;
  workItemType: { name: string } | null;
  namespace: { fullPath: string } | null;
}

export interface WorkItemDaIssue {
  iid: number | string;
  widgets?: ({ children?: { nodes?: WorkItemFilho[] } } | null)[];
}

export interface RepositorioDaVersao {
  caminho: string;
  nome: string;
  url: string;
  tasks: number;
  abertas: number;
  fechadas: number;
}

export interface RepositoriosDaVersao {
  repositorios: RepositorioDaVersao[];
  issuesSemTask: number[];
}

export function ehTask(filho: WorkItemFilho) {
  const tipo = filho.workItemType?.name?.toLowerCase() ?? '';

  return TIPOS_DE_TASK.includes(tipo);
}

export function nomeCurto(caminho: string) {
  const partes = caminho.split('/').filter(Boolean);

  return partes[partes.length - 1] ?? caminho;
}

export function tasksDaIssue(issue: WorkItemDaIssue): WorkItemFilho[] {
  const filhos = (issue.widgets ?? []).flatMap((widget) => widget?.children?.nodes ?? []);

  return filhos.filter(ehTask);
}

export function agruparPorRepositorio(
  issues: WorkItemDaIssue[],
  base: string,
): RepositoriosDaVersao {
  const porCaminho = new Map<string, RepositorioDaVersao>();
  const issuesSemTask: number[] = [];

  for (const issue of issues) {
    const tasks = tasksDaIssue(issue);

    if (tasks.length === 0) {
      issuesSemTask.push(Number(issue.iid));
      continue;
    }

    for (const task of tasks) {
      const caminho = task.namespace?.fullPath;

      if (!caminho) {
        continue;
      }

      const repositorio = porCaminho.get(caminho) ?? {
        caminho,
        nome: nomeCurto(caminho),
        url: `${base.replace(/\/+$/, '')}/${caminho}`,
        tasks: 0,
        abertas: 0,
        fechadas: 0,
      };

      repositorio.tasks += 1;

      if (task.state === 'CLOSED' || task.state === 'closed') {
        repositorio.fechadas += 1;
      } else {
        repositorio.abertas += 1;
      }

      porCaminho.set(caminho, repositorio);
    }
  }

  const repositorios = [...porCaminho.values()].sort(
    (a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.caminho.localeCompare(b.caminho, 'pt-BR'),
  );

  return { repositorios, issuesSemTask: issuesSemTask.sort((a, b) => a - b) };
}
