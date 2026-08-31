import {
  inicioDoPeriodo,
  labelDaCriticidade,
  labelDoEsforco,
  labelsDeCriticidade,
  labelsDeEsforco,
  ordenarPorCriacao,
  temCriticidade,
} from './backlog-gitlab';
import { esforcoPorPontos } from './priorizacao';
import type { IssueDaVersao } from './versao-gitlab';

function issue(id: number, criadaEm: string): IssueDaVersao {
  return {
    id,
    titulo: `Issue ${id}`,
    tipos: [],
    estado: null,
    sistema: null,
    autor: null,
    responsavel: null,
    situacao: 'aberta',
    url: `http://gitlab/issues/${id}`,
    criadaEm,
    atualizadaEm: criadaEm,
    fechadaEm: null,
  };
}

describe('temCriticidade', () => {
  it.each([
    [['criticidade::P1'], true],
    [['type::bug', 'criticidade::P4'], true],
    [['type::bug', 'system::cliqq-centralizado'], false],
    [[], false],
  ])('reconhece %s como classificada: %s', (labels, esperado) => {
    expect(temCriticidade(labels)).toBe(esperado);
  });

  it('não confunde com label parecido', () => {
    expect(temCriticidade(['criticidade-alta'])).toBe(false);
  });
});

describe('inicioDoPeriodo', () => {
  it('volta os dias pedidos a partir de agora', () => {
    const agora = new Date('2026-08-31T12:00:00.000Z');

    expect(inicioDoPeriodo(7, agora)).toBe('2026-08-24T12:00:00.000Z');
    expect(inicioDoPeriodo(30, agora)).toBe('2026-08-01T12:00:00.000Z');
  });

  it('atravessa a virada de mês', () => {
    expect(inicioDoPeriodo(15, new Date('2026-03-10T00:00:00.000Z'))).toBe(
      '2026-02-23T00:00:00.000Z',
    );
  });
});

describe('ordenarPorCriacao', () => {
  it('põe as mais recentes primeiro', () => {
    const issues = [
      issue(1, '2026-08-01T10:00:00.000Z'),
      issue(2, '2026-08-31T10:00:00.000Z'),
      issue(3, '2026-08-15T10:00:00.000Z'),
    ];

    expect(ordenarPorCriacao(issues).map((i) => i.id)).toEqual([2, 3, 1]);
  });

  it('desempata pelo número da issue, do maior para o menor', () => {
    const issues = [
      issue(10, '2026-08-31T10:00:00.000Z'),
      issue(20, '2026-08-31T10:00:00.000Z'),
    ];

    expect(ordenarPorCriacao(issues).map((i) => i.id)).toEqual([20, 10]);
  });

  it('não mexe na lista recebida', () => {
    const issues = [issue(1, '2026-08-01T10:00:00.000Z'), issue(2, '2026-08-31T10:00:00.000Z')];

    ordenarPorCriacao(issues);

    expect(issues.map((i) => i.id)).toEqual([1, 2]);
  });
});

describe('labels de criticidade', () => {
  it('monta o label na grafia do grupo, com o P maiúsculo', () => {
    expect(labelDaCriticidade('P2')).toBe('criticidade::P2');
  });

  it('lista as duas grafias, para limpar a criticidade anterior', () => {
    expect(labelsDeCriticidade()).toEqual([
      'criticidade::P1',
      'criticidade::p1',
      'criticidade::P2',
      'criticidade::p2',
      'criticidade::P3',
      'criticidade::p3',
      'criticidade::P4',
      'criticidade::p4',
    ]);
  });

  it('reconhece como classificada a issue que acabou de receber o label', () => {
    expect(temCriticidade([labelDaCriticidade('P4')])).toBe(true);
  });
});

describe('labels de esforço', () => {
  it.each([
    [20, 'esforco::1'],
    [17, 'esforco::3'],
    [14, 'esforco::7'],
    [11, 'esforco::14'],
    [8, 'esforco::30'],
    [5, 'esforco::60'],
    [2, 'esforco::60+'],
  ])('converte %s pontos no label %s', (pontos, esperado) => {
    expect(labelDoEsforco(pontos)).toBe(esperado);
  });

  it('conta dias corridos, não os dias úteis do KPI', () => {
    expect(labelDoEsforco(14)).toBe('esforco::7');
    expect(esforcoPorPontos(14)?.dias).toBe(5);
  });

  it('marca com ? o esforço que ainda não dá para estimar', () => {
    expect(labelDoEsforco(0)).toBe('esforco::?');
  });

  it('não devolve label para pontuação fora da escala', () => {
    expect(labelDoEsforco(10)).toBeNull();
  });

  it('lista o escopo inteiro, incluindo a etiqueta aposentada', () => {
    expect(labelsDeEsforco()).toEqual([
      'esforco::1',
      'esforco::3',
      'esforco::7',
      'esforco::14',
      'esforco::30',
      'esforco::60',
      'esforco::60+',
      'esforco::?',
      'esforco::2',
    ]);
  });
});
