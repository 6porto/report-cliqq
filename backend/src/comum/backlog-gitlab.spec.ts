import { inicioDoPeriodo, ordenarPorCriacao, temCriticidade } from './backlog-gitlab';
import type { IssueDaVersao } from './versao-gitlab';

function issue(id: number, criadaEm: string): IssueDaVersao {
  return {
    id,
    titulo: `Issue ${id}`,
    tipos: [],
    estado: null,
    sistema: null,
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
