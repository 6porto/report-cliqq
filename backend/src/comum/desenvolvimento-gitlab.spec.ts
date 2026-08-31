import {
  milestonesAbertas,
  montarMilestone,
  tagsDaDescricao,
} from './desenvolvimento-gitlab';
import { mapearMilestone, type IssueDaVersao, type MilestoneGitlab } from './versao-gitlab';

function milestone(parcial: Partial<MilestoneGitlab>): MilestoneGitlab {
  return {
    id: 412,
    iid: 37,
    title: 'release/2026-09-carrossel',
    description: null,
    state: 'active',
    start_date: '2026-09-01',
    due_date: '2026-09-30',
    web_url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/milestones/37',
    ...parcial,
  };
}

function issue(parcial: Partial<IssueDaVersao>): IssueDaVersao {
  return {
    id: 1234,
    titulo: 'Ajuste no carrossel',
    tipos: ['melhoria'],
    estado: 'aguardando-release',
    sistema: 'cliqq-centralizado',
    autor: 'Gustavo Silva',
    responsavel: null,
    situacao: 'aberta',
    url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/issues/1234',
    criadaEm: '2026-08-01T12:00:00Z',
    atualizadaEm: '2026-08-20T12:00:00Z',
    fechadaEm: null,
    ...parcial,
  };
}

describe('milestonesAbertas', () => {
  it('mantém apenas milestone ativa com prefixo de versão', () => {
    const abertas = milestonesAbertas([
      milestone({ id: 1, title: 'release/2026-09-carrossel' }),
      milestone({ id: 2, title: 'fix/2026-08-estoque', due_date: '2026-08-31' }),
      milestone({ id: 3, title: 'release/2026-07-antiga', state: 'closed' }),
      milestone({ id: 4, title: 'Planejamento 2026' }),
    ]);

    expect(abertas.map((versao) => versao.id)).toEqual([2, 1]);
  });

  it('ordena pelo título, sem olhar a data de entrega', () => {
    const abertas = milestonesAbertas([
      milestone({ id: 1, title: 'release/setembro', due_date: '2026-09-30' }),
      milestone({ id: 2, title: 'fix/sem-data', due_date: null }),
      milestone({ id: 3, title: 'release/agosto', due_date: '2026-08-31' }),
    ]);

    expect(abertas.map((versao) => versao.titulo)).toEqual([
      'fix/sem-data',
      'release/agosto',
      'release/setembro',
    ]);
  });

  it('compara números pelo valor, não caractere a caractere', () => {
    const abertas = milestonesAbertas([
      milestone({ id: 1, title: 'release/10' }),
      milestone({ id: 2, title: 'release/9' }),
      milestone({ id: 3, title: 'release/2' }),
    ]);

    expect(abertas.map((versao) => versao.titulo)).toEqual([
      'release/2',
      'release/9',
      'release/10',
    ]);
  });
});

describe('tagsDaDescricao', () => {
  it('lê as linhas que a geração de versão grava', () => {
    const tags = tagsDaDescricao(
      [
        'Entrega do carrossel na home',
        '- cliqq/backend [v_1.4.0-rc2](http://gitlab/mercantil/cliqq/backend/-/tags/v_1.4.0-rc2)',
        '- cliqq/ui [v_2.0.1-rc1](http://gitlab/mercantil/cliqq/ui/-/tags/v_2.0.1-rc1)',
      ].join('\n'),
    );

    expect(tags).toEqual([
      {
        repositorio: 'cliqq/backend',
        tag: 'v_1.4.0-rc2',
        url: 'http://gitlab/mercantil/cliqq/backend/-/tags/v_1.4.0-rc2',
      },
      {
        repositorio: 'cliqq/ui',
        tag: 'v_2.0.1-rc1',
        url: 'http://gitlab/mercantil/cliqq/ui/-/tags/v_2.0.1-rc1',
      },
    ]);
  });

  it('aceita a linha escrita à mão, sem link', () => {
    expect(tagsDaDescricao('- cliqq/bff v_3.1.0')).toEqual([
      { repositorio: 'cliqq/bff', tag: 'v_3.1.0', url: null },
    ]);
  });

  it('ignora descrição vazia e linha sem versão', () => {
    expect(tagsDaDescricao(null)).toEqual([]);
    expect(tagsDaDescricao('- combinar data com a operação')).toEqual([]);
  });
});

describe('montarMilestone', () => {
  it('conta abertas e fechadas e carrega as tags da descrição', () => {
    const versao = mapearMilestone(
      milestone({ description: '- cliqq/backend [v_1.4.0-rc2](http://gitlab/t)' }),
    );

    const montada = montarMilestone(versao, [
      issue({ id: 1, situacao: 'aberta' }),
      issue({ id: 2, situacao: 'fechada' }),
      issue({ id: 3, situacao: 'fechada' }),
    ]);

    expect(montada.total).toBe(3);
    expect(montada.abertas).toBe(1);
    expect(montada.fechadas).toBe(2);
    expect(montada.tags).toHaveLength(1);
    expect(montada.titulo).toBe('release/2026-09-carrossel');
  });

  it('milestone sem issue fica zerada, não some', () => {
    const montada = montarMilestone(mapearMilestone(milestone({})), []);

    expect(montada.total).toBe(0);
    expect(montada.issues).toEqual([]);
  });
});
