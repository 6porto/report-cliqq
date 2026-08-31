import {
  ehRepositorioSemVersionamento,
  interpretarTag,
  ultimasMinors,
  type TagGitlab,
} from './tags-gitlab';

function tag(name: string, criadaEm = '2026-08-27T10:00:00.000-03:00'): TagGitlab {
  return { name, commit: { created_at: criadaEm } };
}

describe('interpretarTag', () => {
  it.each([
    ['v_2.4.0-rc2', { major: 2, minor: 4, patch: 0, rc: 2 }],
    ['2.3.0-rc1', { major: 2, minor: 3, patch: 0, rc: 1 }],
    ['v2.1.7', { major: 2, minor: 1, patch: 7, rc: -1 }],
    ['v_10.20.30-rc140', { major: 10, minor: 20, patch: 30, rc: 140 }],
  ])('interpreta %s', (nome, esperado) => {
    expect(interpretarTag(nome)).toEqual(esperado);
  });

  it.each([
    ['teste-performance-stress'],
    ['cliqq-centralizado-ui-v_2.3.0-rc3-39'],
    ['$APP_NAME-v_2.3.0-rc3-36'],
    ['v_2.4-rc2'],
    [''],
  ])('descarta %s', (nome) => {
    expect(interpretarTag(nome)).toBeNull();
  });
});

describe('ultimasMinors', () => {
  it('devolve uma tag por minor, com o maior patch e o maior rc', () => {
    const tags = [
      tag('v_2.3.1-rc1'),
      tag('v_2.3.0-rc2'),
      tag('v_2.4.0-rc2'),
      tag('v_2.4.0-rc1'),
      tag('v_2.2.3-rc1'),
      tag('v_2.2.2-rc1'),
      tag('v_2.1.0-rc140'),
    ];

    expect(ultimasMinors(tags).map((item) => item.nome)).toEqual([
      'v_2.4.0-rc2',
      'v_2.3.1-rc1',
      'v_2.2.3-rc1',
    ]);
  });

  it('ordena pelas minors mais altas, não pela ordem recebida', () => {
    const tags = [tag('v_1.9.0-rc1'), tag('v_3.0.0-rc1'), tag('v_2.5.0-rc1')];

    expect(ultimasMinors(tags).map((item) => item.minor)).toEqual(['3.0', '2.5', '1.9']);
  });

  it('a maior rc ganha da tag final da mesma versão', () => {
    const tags = [tag('v_2.3.1'), tag('v_2.3.1-rc2')];

    expect(ultimasMinors(tags)[0].nome).toBe('v_2.3.1-rc2');
  });

  it('o maior patch decide antes do rc', () => {
    const tags = [tag('v_2.3.0-rc9'), tag('v_2.3.1-rc1')];

    expect(ultimasMinors(tags)[0].nome).toBe('v_2.3.1-rc1');
  });

  it('ignora tags fora do padrão', () => {
    const tags = [tag('teste-performance-stress'), tag('v_2.3.0-rc1')];

    expect(ultimasMinors(tags).map((item) => item.nome)).toEqual(['v_2.3.0-rc1']);
  });

  it('devolve menos de três quando o repositório tem poucas minors', () => {
    expect(ultimasMinors([tag('v_1.0.0-rc1')])).toHaveLength(1);
  });

  it('leva a data do commit da tag escolhida', () => {
    const tags = [tag('v_2.3.0-rc1', '2026-08-01T09:00:00.000-03:00')];

    expect(ultimasMinors(tags)[0].criadaEm).toBe('2026-08-01T09:00:00.000-03:00');
  });

  it('aceita tag sem commit', () => {
    expect(ultimasMinors([{ name: 'v_2.3.0-rc1' }])[0].criadaEm).toBeNull();
  });
});

describe('ehRepositorioSemVersionamento', () => {
  it.each([
    ['mercantil/kubernetes/prd-config', true],
    ['mercantil/kubernetes/dev-config', true],
    ['mercantil/kubernetes/qas-config', true],
    ['mercantil/cliqq/cliqq-centralizado/backend', false],
  ])('%s fica de fora: %s', (caminho, esperado) => {
    expect(ehRepositorioSemVersionamento(caminho)).toBe(esperado);
  });
});
