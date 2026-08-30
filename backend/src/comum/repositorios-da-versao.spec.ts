import {
  agruparPorRepositorio,
  ehTask,
  nomeCurto,
  tasksDaIssue,
  type WorkItemDaIssue,
  type WorkItemFilho,
} from './repositorios-da-versao';

const BASE = 'http://gitlab.queroquero.com.br';

function task(caminho: string, parcial: Partial<WorkItemFilho> = {}): WorkItemFilho {
  return {
    iid: 3,
    title: 'Ajustar o cálculo',
    state: 'OPEN',
    webUrl: `${BASE}/${caminho}/-/work_items/3`,
    workItemType: { name: 'Task' },
    namespace: { fullPath: caminho },
    ...parcial,
  };
}

function issue(iid: number, filhos: WorkItemFilho[]): WorkItemDaIssue {
  return { iid, widgets: [null, { children: { nodes: filhos } }] };
}

describe('ehTask', () => {
  it.each([
    ['Task', true],
    ['task', true],
    ['Tarefa', true],
    ['Issue', false],
    ['Objective', false],
  ])('reconhece o tipo %s como task: %s', (tipo, esperado) => {
    expect(ehTask(task('a/b', { workItemType: { name: tipo } }))).toBe(esperado);
  });

  it('descarta filho sem tipo', () => {
    expect(ehTask(task('a/b', { workItemType: null }))).toBe(false);
  });
});

describe('nomeCurto', () => {
  it('devolve o último segmento do caminho', () => {
    expect(nomeCurto('mercantil/cliqq/cliqq-centralizado/backend')).toBe('backend');
  });

  it('aceita caminho de um nível só', () => {
    expect(nomeCurto('qq-filiais')).toBe('qq-filiais');
  });
});

describe('tasksDaIssue', () => {
  it('junta os filhos de todos os widgets e descarta o que não é task', () => {
    const filhos = [
      task('mercantil/qq-filiais'),
      task('mercantil/qq-preco', { workItemType: { name: 'Issue' } }),
    ];

    expect(tasksDaIssue(issue(10, filhos))).toHaveLength(1);
  });

  it('devolve lista vazia quando a issue não tem widget de hierarquia', () => {
    expect(tasksDaIssue({ iid: 10, widgets: [null] })).toEqual([]);
  });
});

describe('agruparPorRepositorio', () => {
  it('conta as tasks por projeto e separa abertas de fechadas', () => {
    const issues = [
      issue(10, [
        task('mercantil/cliqq/cliqq-centralizado/backend'),
        task('mercantil/cliqq/cliqq-centralizado/backend', { state: 'CLOSED' }),
        task('mercantil/qq-filiais'),
      ]),
      issue(11, [task('mercantil/cliqq/cliqq-centralizado/backend')]),
    ];

    const { repositorios } = agruparPorRepositorio(issues, BASE);

    expect(repositorios).toEqual([
      {
        caminho: 'mercantil/cliqq/cliqq-centralizado/backend',
        nome: 'backend',
        url: `${BASE}/mercantil/cliqq/cliqq-centralizado/backend`,
        tasks: 3,
        abertas: 2,
        fechadas: 1,
      },
      {
        caminho: 'mercantil/qq-filiais',
        nome: 'qq-filiais',
        url: `${BASE}/mercantil/qq-filiais`,
        tasks: 1,
        abertas: 1,
        fechadas: 0,
      },
    ]);
  });

  it('ordena pelo nome curto, não pelo caminho completo', () => {
    const issues = [
      issue(10, [task('mercantil/zz-grupo/api'), task('mercantil/aa-grupo/ui')]),
    ];

    const nomes = agruparPorRepositorio(issues, BASE).repositorios.map((repo) => repo.nome);

    expect(nomes).toEqual(['api', 'ui']);
  });

  it('lista as issues que não têm nenhuma task', () => {
    const issues = [issue(12, []), issue(7, [task('mercantil/qq-preco')]), issue(9, [])];

    expect(agruparPorRepositorio(issues, BASE).issuesSemTask).toEqual([9, 12]);
  });

  it('descarta task sem projeto', () => {
    const issues = [issue(10, [task('mercantil/qq-preco', { namespace: null })])];

    expect(agruparPorRepositorio(issues, BASE).repositorios).toEqual([]);
  });

  it('não duplica a barra quando a URL base termina com barra', () => {
    const issues = [issue(10, [task('mercantil/qq-preco')])];

    expect(agruparPorRepositorio(issues, `${BASE}/`).repositorios[0].url).toBe(
      `${BASE}/mercantil/qq-preco`,
    );
  });
});
