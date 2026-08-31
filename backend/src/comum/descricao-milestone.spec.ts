import { atualizarLinhaDoRepositorio } from './descricao-milestone';

const URL = 'http://gitlab.queroquero.com.br/mercantil/cliqq/cliqq-centralizado/backend/-/tags';

describe('atualizarLinhaDoRepositorio', () => {
  it('troca a linha que já cita o repositório, agora com a tag em link', () => {
    const descricao = 'Resumo\r\n\r\n - cliqq-centralizado/backend v_2.4.0-rc2';

    expect(
      atualizarLinhaDoRepositorio(
        descricao,
        'cliqq-centralizado/backend',
        'v_2.4.0-rc3',
        `${URL}/v_2.4.0-rc3`,
      ),
    ).toBe(
      `Resumo\n\n- cliqq-centralizado/backend [v_2.4.0-rc3](${URL}/v_2.4.0-rc3)`,
    );
  });

  it('substitui a linha mesmo quando ela já estava em markdown', () => {
    const descricao = `- cliqq-centralizado/backend [v_2.4.0-rc2](${URL}/v_2.4.0-rc2)`;

    expect(
      atualizarLinhaDoRepositorio(
        descricao,
        'cliqq-centralizado/backend',
        'v_2.4.0-rc3',
        `${URL}/v_2.4.0-rc3`,
      ),
    ).toBe(`- cliqq-centralizado/backend [v_2.4.0-rc3](${URL}/v_2.4.0-rc3)`);
  });

  it('acrescenta a linha quando o repositório ainda não aparece', () => {
    const descricao = 'Resumo\n\n- cliqq-centralizado/backend v_2.4.0-rc2';

    expect(
      atualizarLinhaDoRepositorio(descricao, 'cliqq-centralizado/ui', 'v_2.5.0-rc1', `${URL}/x`),
    ).toBe(
      `Resumo\n\n- cliqq-centralizado/backend v_2.4.0-rc2\n- cliqq-centralizado/ui [v_2.5.0-rc1](${URL}/x)`,
    );
  });

  it('vira a primeira linha quando a descrição está vazia', () => {
    expect(
      atualizarLinhaDoRepositorio(null, 'cliqq-centralizado/bff', 'v_2.5.0-rc1', `${URL}/x`),
    ).toBe(`- cliqq-centralizado/bff [v_2.5.0-rc1](${URL}/x)`);
    expect(
      atualizarLinhaDoRepositorio('   ', 'cliqq-centralizado/bff', 'v_2.5.0-rc1', `${URL}/x`),
    ).toBe(`- cliqq-centralizado/bff [v_2.5.0-rc1](${URL}/x)`);
  });

  it('encontra a linha ignorando maiúsculas', () => {
    const descricao = '- CLIQQ-CENTRALIZADO/UI v_2.2.0-rc1';

    expect(
      atualizarLinhaDoRepositorio(descricao, 'cliqq-centralizado/ui', 'v_2.5.0-rc1', `${URL}/x`),
    ).toBe(`- cliqq-centralizado/ui [v_2.5.0-rc1](${URL}/x)`);
  });

  it('não deixa linha em branco sobrando ao acrescentar', () => {
    expect(
      atualizarLinhaDoRepositorio('Resumo\n\n', 'qq-preco/qq-preco', 'v_1.0.0-rc1', `${URL}/x`),
    ).toBe(`Resumo\n- qq-preco/qq-preco [v_1.0.0-rc1](${URL}/x)`);
  });

  it('mexe só na linha do repositório', () => {
    const descricao = '- cliqq-centralizado/bff v_2.4.0-rc1\n- cliqq-centralizado/ui v_2.4.0-rc1';

    expect(
      atualizarLinhaDoRepositorio(descricao, 'cliqq-centralizado/ui', 'v_2.4.0-rc2', `${URL}/x`),
    ).toBe(
      `- cliqq-centralizado/bff v_2.4.0-rc1\n- cliqq-centralizado/ui [v_2.4.0-rc2](${URL}/x)`,
    );
  });
});
