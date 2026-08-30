import { atualizarLinhaDoRepositorio } from './descricao-milestone';

describe('atualizarLinhaDoRepositorio', () => {
  it('troca a tag da linha que já cita o repositório', () => {
    const descricao = 'Resumo\r\n\r\n - cliqq-centralizado/backend v_2.4.0-rc2';

    expect(
      atualizarLinhaDoRepositorio(descricao, 'cliqq-centralizado/backend', 'v_2.4.0-rc3'),
    ).toBe('Resumo\n\n- cliqq-centralizado/backend v_2.4.0-rc3');
  });

  it('acrescenta a linha quando o repositório ainda não aparece', () => {
    const descricao = 'Resumo\n\n- cliqq-centralizado/backend v_2.4.0-rc2';

    expect(atualizarLinhaDoRepositorio(descricao, 'cliqq-centralizado/ui', 'v_2.5.0-rc1')).toBe(
      'Resumo\n\n- cliqq-centralizado/backend v_2.4.0-rc2\n- cliqq-centralizado/ui v_2.5.0-rc1',
    );
  });

  it('vira a primeira linha quando a descrição está vazia', () => {
    expect(atualizarLinhaDoRepositorio(null, 'cliqq-centralizado/bff', 'v_2.5.0-rc1')).toBe(
      '- cliqq-centralizado/bff v_2.5.0-rc1',
    );
    expect(atualizarLinhaDoRepositorio('   ', 'cliqq-centralizado/bff', 'v_2.5.0-rc1')).toBe(
      '- cliqq-centralizado/bff v_2.5.0-rc1',
    );
  });

  it('encontra a linha ignorando maiúsculas', () => {
    const descricao = '- CLIQQ-CENTRALIZADO/UI v_2.2.0-rc1';

    expect(atualizarLinhaDoRepositorio(descricao, 'cliqq-centralizado/ui', 'v_2.5.0-rc1')).toBe(
      '- cliqq-centralizado/ui v_2.5.0-rc1',
    );
  });

  it('não deixa linha em branco sobrando ao acrescentar', () => {
    expect(atualizarLinhaDoRepositorio('Resumo\n\n', 'qq-preco/qq-preco', 'v_1.0.0-rc1')).toBe(
      'Resumo\n- qq-preco/qq-preco v_1.0.0-rc1',
    );
  });

  it('mexe só na linha do repositório', () => {
    const descricao = '- cliqq-centralizado/bff v_2.4.0-rc1\n- cliqq-centralizado/ui v_2.4.0-rc1';

    expect(atualizarLinhaDoRepositorio(descricao, 'cliqq-centralizado/ui', 'v_2.4.0-rc2')).toBe(
      '- cliqq-centralizado/bff v_2.4.0-rc1\n- cliqq-centralizado/ui v_2.4.0-rc2',
    );
  });
});
