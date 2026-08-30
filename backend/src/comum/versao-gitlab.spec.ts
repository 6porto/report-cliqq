import {
  ehTituloDeVersao,
  filtrarVersoes,
  mapearIssueDaVersao,
  mapearIssuesDaVersao,
  mapearMilestone,
  ordenarVersoes,
  valorDoLabel,
  valoresDoLabel,
  versoesProntas,
  type IssueDaVersaoGitlab,
  type MilestoneGitlab,
} from './versao-gitlab';

class MilestoneBuilder {
  private milestone: MilestoneGitlab = {
    id: 412,
    iid: 37,
    title: 'release/2026-09-carrossel',
    description: 'Entrega do carrossel na home',
    state: 'active',
    start_date: '2026-09-01',
    due_date: '2026-09-30',
    web_url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/milestones/37',
  };

  comId(id: number): this {
    this.milestone = { ...this.milestone, id };
    return this;
  }

  comTitulo(title: string): this {
    this.milestone = { ...this.milestone, title };
    return this;
  }

  comEstado(state: string): this {
    this.milestone = { ...this.milestone, state };
    return this;
  }

  comDataFim(due_date: string | null): this {
    this.milestone = { ...this.milestone, due_date };
    return this;
  }

  comDescricao(description: string | null): this {
    this.milestone = { ...this.milestone, description };
    return this;
  }

  build(): MilestoneGitlab {
    return { ...this.milestone };
  }
}

class IssueBuilder {
  private issue: IssueDaVersaoGitlab = {
    iid: 965,
    title: 'CRM2232 - Nova regra de precificação',
    state: 'opened',
    labels: ['system::cliqq-centralizado', 'type::crm', 'state::desenvolvimento'],
    web_url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/issues/965',
    assignee: { name: 'Gustavo Silva' },
    created_at: '2026-08-01T12:00:00.000Z',
    updated_at: '2026-08-20T09:30:00.000Z',
    closed_at: null,
  };

  comIid(iid: number | string): this {
    this.issue = { ...this.issue, iid };
    return this;
  }

  comEstado(state: string): this {
    this.issue = { ...this.issue, state };
    return this;
  }

  comLabels(labels: string[]): this {
    this.issue = { ...this.issue, labels };
    return this;
  }

  comResponsavel(assignee: { name?: string | null } | null): this {
    this.issue = { ...this.issue, assignee };
    return this;
  }

  fechadaEm(closed_at: string | null): this {
    this.issue = { ...this.issue, closed_at };
    return this;
  }

  build(): IssueDaVersaoGitlab {
    return { ...this.issue };
  }
}

describe('ehTituloDeVersao', () => {
  it.each([
    ['release/2026-09-carrossel', true],
    ['fix/correcao-pix', true],
    ['RELEASE/2026-09-carrossel', true],
    ['Fix/Correcao-Pix', true],
    ['  release/com-espaco', true],
    ['feat/2026-09', false],
    ['feature/2026-09-carrossel', false],
    ['hotfix/1.2.0', false],
    ['prerelease/algo', false],
    ['sprint 42', false],
  ])('reconhece %s como versão: %s', (titulo, esperado) => {
    expect(ehTituloDeVersao(titulo)).toBe(esperado);
  });
});

describe('valorDoLabel', () => {
  it('devolve o texto depois do prefixo', () => {
    expect(valorDoLabel(['type::crm', 'state::teste'], 'state::')).toBe('teste');
  });

  it('devolve nulo quando nenhum label tem o prefixo', () => {
    expect(valorDoLabel(['type::crm'], 'system::')).toBeNull();
  });
});

describe('valoresDoLabel', () => {
  it('junta e ordena todos os labels do prefixo', () => {
    const labels = ['type::problemas-produção', 'squad::alfa', 'type::bug'];

    expect(valoresDoLabel(labels, 'type::')).toEqual(['bug', 'problemas-produção']);
  });

  it('devolve lista vazia quando nenhum label tem o prefixo', () => {
    expect(valoresDoLabel(['squad::alfa'], 'type::')).toEqual([]);
  });
});

describe('mapearMilestone', () => {
  it('traduz os campos do GitLab para o vocabulário da tela', () => {
    const versao = mapearMilestone(new MilestoneBuilder().build());

    expect(versao).toEqual({
      id: 412,
      iid: 37,
      titulo: 'release/2026-09-carrossel',
      descricao: 'Entrega do carrossel na home',
      estado: 'active',
      dataInicio: '2026-09-01',
      dataFim: '2026-09-30',
      url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/milestones/37',
    });
  });

  it('trata descrição vazia como ausente', () => {
    expect(mapearMilestone(new MilestoneBuilder().comDescricao('').build()).descricao).toBeNull();
  });
});

describe('filtrarVersoes', () => {
  it('descarta milestones fora dos prefixos e mantém as fechadas', () => {
    const milestones = [
      new MilestoneBuilder().comId(1).comTitulo('release/nova-home').build(),
      new MilestoneBuilder().comId(2).comTitulo('sprint 42').build(),
      new MilestoneBuilder().comId(3).comTitulo('fix/pix').comEstado('closed').build(),
    ];

    expect(filtrarVersoes(milestones).map((versao) => versao.titulo)).toEqual([
      'fix/pix',
      'release/nova-home',
    ]);
  });
});

describe('ordenarVersoes', () => {
  it('põe a entrega mais recente primeiro e as sem data no fim', () => {
    const milestones = [
      new MilestoneBuilder().comId(1).comTitulo('fix/antiga').comDataFim('2026-07-01').build(),
      new MilestoneBuilder().comId(2).comTitulo('release/sem-data').comDataFim(null).build(),
      new MilestoneBuilder().comId(3).comTitulo('release/nova').comDataFim('2026-10-01').build(),
    ];

    const titulos = ordenarVersoes(milestones.map(mapearMilestone)).map((versao) => versao.titulo);

    expect(titulos).toEqual(['release/nova', 'fix/antiga', 'release/sem-data']);
  });
});

describe('versoesProntas', () => {
  it('agrupa as issues por milestone e conta quantas estão prontas', () => {
    const fix = new MilestoneBuilder()
      .comId(1)
      .comTitulo('fix/001')
      .comDataFim('2026-09-01')
      .build();
    const release = new MilestoneBuilder()
      .comId(2)
      .comTitulo('release/001')
      .comDataFim('2026-09-04')
      .build();

    const prontas = versoesProntas([
      { iid: 10, milestone: fix },
      { iid: 11, milestone: release },
      { iid: 12, milestone: fix },
    ]);

    expect(prontas.map((versao) => [versao.titulo, versao.issuesNoEstado])).toEqual([
      ['release/001', 1],
      ['fix/001', 2],
    ]);
  });

  it('descarta issue sem milestone, milestone fechada e título fora dos prefixos', () => {
    const fechada = new MilestoneBuilder().comId(3).comTitulo('fix/002').comEstado('closed').build();
    const sprint = new MilestoneBuilder().comId(4).comTitulo('sprint::2026-abr').build();

    const prontas = versoesProntas([
      { iid: 20, milestone: null },
      { iid: 21, milestone: fechada },
      { iid: 22, milestone: sprint },
    ]);

    expect(prontas).toEqual([]);
  });
});

describe('mapearIssueDaVersao', () => {
  it('extrai tipo, estado, sistema e responsável dos labels', () => {
    const issue = mapearIssueDaVersao(new IssueBuilder().build());

    expect(issue).toEqual({
      id: 965,
      titulo: 'CRM2232 - Nova regra de precificação',
      tipos: ['crm'],
      estado: 'desenvolvimento',
      sistema: 'cliqq-centralizado',
      responsavel: 'Gustavo Silva',
      situacao: 'aberta',
      url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/issues/965',
      criadaEm: '2026-08-01T12:00:00.000Z',
      atualizadaEm: '2026-08-20T09:30:00.000Z',
      fechadaEm: null,
    });
  });

  it('marca como fechada a issue com state closed', () => {
    const issue = mapearIssueDaVersao(
      new IssueBuilder().comEstado('closed').fechadaEm('2026-08-25T10:00:00.000Z').build(),
    );

    expect(issue.situacao).toBe('fechada');
    expect(issue.fechadaEm).toBe('2026-08-25T10:00:00.000Z');
  });

  it('aceita issue sem labels e sem responsável', () => {
    const issue = mapearIssueDaVersao(
      new IssueBuilder().comLabels([]).comResponsavel(null).build(),
    );

    expect(issue.tipos).toEqual([]);
    expect(issue.estado).toBeNull();
    expect(issue.sistema).toBeNull();
    expect(issue.responsavel).toBeNull();
  });
});

describe('mapearIssuesDaVersao', () => {
  it('ordena por número da issue', () => {
    const issues = [
      new IssueBuilder().comIid(970).build(),
      new IssueBuilder().comIid(12).build(),
      new IssueBuilder().comIid('301').build(),
    ];

    expect(mapearIssuesDaVersao(issues).map((issue) => issue.id)).toEqual([12, 301, 970]);
  });
});
