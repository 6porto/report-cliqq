import {
  estadoDaIssue,
  mapearIssue,
  resumirSincronizacao,
  tipoDaIssue,
  unirIssues,
  type IssueGitlab,
} from './issues-gitlab';

class IssueBuilder {
  private issue: IssueGitlab = {
    iid: 965,
    title: 'CRM2232 - Nova regra de precificação',
    labels: ['system::cliqq-centralizado', 'type::crm', 'state::pendente-priorizacao'],
    web_url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/issues/965',
  };

  comIid(iid: number | string): this {
    this.issue = { ...this.issue, iid };
    return this;
  }

  comTitulo(title: string): this {
    this.issue = { ...this.issue, title };
    return this;
  }

  comLabels(labels: string[]): this {
    this.issue = { ...this.issue, labels };
    return this;
  }

  build(): IssueGitlab {
    return { ...this.issue };
  }
}

describe('tipoDaIssue', () => {
  it.each([
    [['type::crm'], 'crm'],
    [['type::melhoria'], 'melhoria'],
    [['type::melhoria', 'type::crm'], 'crm'],
  ])('%s vira %s', (labels, esperado) => {
    expect(tipoDaIssue(labels)).toBe(esperado);
  });

  it('ignora tipo fora do filtro', () => {
    expect(tipoDaIssue(['type::bug', 'type::refactor'])).toBeNull();
  });
});

describe('estadoDaIssue', () => {
  it('devolve o state sem o prefixo', () => {
    expect(estadoDaIssue(['squad::alfa', 'state::priorizado'])).toBe('priorizado');
  });

  it('devolve nulo quando a issue não tem state', () => {
    expect(estadoDaIssue(['squad::alfa'])).toBeNull();
  });
});

describe('mapearIssue', () => {
  it('converte a issue em demanda', () => {
    const demanda = mapearIssue(new IssueBuilder().build());

    expect(demanda).toEqual({
      id: 965,
      titulo: 'CRM2232 - Nova regra de precificação',
      tipo: 'crm',
      estado: 'pendente-priorizacao',
      url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/issues/965',
    });
  });

  it('converte iid em texto para número', () => {
    expect(mapearIssue(new IssueBuilder().comIid('1188').build())?.id).toBe(1188);
  });

  it('descarta issue sem tipo sincronizado', () => {
    expect(mapearIssue(new IssueBuilder().comLabels(['type::bug']).build())).toBeNull();
  });
});

describe('unirIssues', () => {
  it('remove a repetição entre as buscas por tipo', () => {
    const issues = [
      new IssueBuilder().build(),
      new IssueBuilder().build(),
      new IssueBuilder().comIid(1186).comTitulo('Criar pesquisa').build(),
      new IssueBuilder().comIid(999).comLabels(['type::bug']).build(),
    ];

    expect(unirIssues(issues).map((demanda) => demanda.id)).toEqual([965, 1186]);
  });
});

describe('resumirSincronizacao', () => {
  it('separa novas, atualizadas e as que saíram do filtro', () => {
    const recebidas = [
      mapearIssue(new IssueBuilder().comIid(1).build())!,
      mapearIssue(new IssueBuilder().comIid(2).build())!,
    ];

    const resumo = resumirSincronizacao(
      [
        { id: 2, ativa: true },
        { id: 3, ativa: true },
      ],
      recebidas,
    );

    expect(resumo.novas).toBe(1);
    expect(resumo.atualizadas).toBe(1);
    expect(resumo.sairam).toBe(1);
    expect(resumo.idsQueSairam).toEqual([3]);
    expect(resumo.total).toBe(2);
  });

  it('não conta de novo quem já estava inativa', () => {
    const resumo = resumirSincronizacao([{ id: 3, ativa: false }], []);

    expect(resumo.sairam).toBe(0);
    expect(resumo.idsQueSairam).toEqual([]);
  });
});
