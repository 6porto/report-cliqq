import {
  lerDescricao,
  linhaDaIssue,
  montarDescricaoDoRelease,
  releaseAnterior,
  secaoDaIssue,
} from './release-gitlab';
import type { IssueDaVersao } from './versao-gitlab';

function issue(parcial: Partial<IssueDaVersao> = {}): IssueDaVersao {
  return {
    id: 144,
    titulo: 'CRM2109 - CC - Carta de crédito',
    tipos: ['crm'],
    estado: 'aguardando-release',
    sistema: 'cliqq-centralizado',
    responsavel: 'Gustavo Silva',
    situacao: 'aberta',
    url: 'http://gitlab.queroquero.com.br/mercantil/mercantil/-/issues/144',
    criadaEm: '2026-08-01T12:00:00.000Z',
    atualizadaEm: '2026-08-20T09:30:00.000Z',
    fechadaEm: null,
    ...parcial,
  };
}

describe('secaoDaIssue', () => {
  it.each([
    [['crm'], 'features'],
    [['melhoria'], 'features'],
    [['bug'], 'bugs'],
    [['performance'], 'performance'],
    [['refactor'], 'tecnicos'],
    [['documentação'], 'tecnicos'],
    [[], 'tecnicos'],
  ])('manda %s para %s', (tipos, esperado) => {
    expect(secaoDaIssue(tipos)).toBe(esperado);
  });

  it('o primeiro tipo mapeado decide', () => {
    expect(secaoDaIssue(['problemas-produção', 'bug'])).toBe('bugs');
  });
});

describe('releaseAnterior', () => {
  const releases = [
    { tag_name: 'v_2.4.0-rc2', description: 'rc2' },
    { tag_name: 'v_2.4.0-rc1', description: 'rc1' },
    { tag_name: 'v_2.3.9-rc9', description: 'outra minor' },
    { tag_name: 'teste-solto', description: 'fora do padrão' },
  ];

  it('pega a maior rc abaixo da nova, no mesmo major.minor.patch', () => {
    expect(releaseAnterior(releases, 'v_2.4.0-rc3')?.description).toBe('rc2');
  });

  it('ignora releases de outra minor ou patch', () => {
    expect(releaseAnterior(releases, 'v_2.4.1-rc1')).toBeNull();
    expect(releaseAnterior(releases, 'v_2.5.0-rc1')).toBeNull();
  });

  it('ignora releases com rc igual ou maior', () => {
    expect(releaseAnterior(releases, 'v_2.4.0-rc1')).toBeNull();
  });
});

describe('linhaDaIssue', () => {
  it('escreve título e url', () => {
    expect(linhaDaIssue(issue())).toBe(
      '- CRM2109 - CC - Carta de crédito - http://gitlab.queroquero.com.br/mercantil/mercantil/-/issues/144',
    );
  });
});

describe('lerDescricao', () => {
  it('separa as linhas por seção, ignorando N/A e marcadores', () => {
    const anterior = [
      '## :gear: Features',
      '',
      '- Uma feature - http://x/1 (novo)',
      '',
      '## :tools: Bug fixes',
      '',
      '- N/A',
      '',
      '## :game_die: Cards Técnicos',
      '',
      '* NA',
    ].join('\n');

    const lido = lerDescricao(anterior);

    expect(lido.get('features')).toEqual(['- Uma feature - http://x/1']);
    expect(lido.get('bugs')).toEqual([]);
    expect(lido.get('tecnicos')).toEqual([]);
  });
});

describe('montarDescricaoDoRelease', () => {
  it('monta o documento do zero com todas as seções e N/A nas vazias', () => {
    const documento = montarDescricaoDoRelease(null, [issue()]);

    expect(documento).toContain(
      '## :gear: Features\n\n- CRM2109 - CC - Carta de crédito - http://gitlab.queroquero.com.br/mercantil/mercantil/-/issues/144 (novo)',
    );
    expect(documento).toContain('## :tools: Bug fixes\n\n- N/A');
    expect(documento).toContain('## :notebook: ITs\n\n- N/A');
  });

  it('herda o documento anterior e tira o (novo) das linhas antigas', () => {
    const anterior = '## :gear: Features\n\n- Antiga - http://x/1 (novo)';

    const documento = montarDescricaoDoRelease(anterior, [
      issue({ id: 2, titulo: 'Nova', url: 'http://x/2' }),
    ]);

    expect(documento).toContain(
      '## :gear: Features\n\n- Antiga - http://x/1\n- Nova - http://x/2 (novo)',
    );
  });

  it('marca a linha que já existia quando a issue entra de novo', () => {
    const anterior = '## :gear: Features\n\n- Antiga - http://x/1';

    const documento = montarDescricaoDoRelease(anterior, [
      issue({ id: 1, titulo: 'Antiga', url: 'http://x/1' }),
    ]);

    expect(documento).toContain('## :gear: Features\n\n- Antiga - http://x/1 (novo)');
    expect(documento).not.toContain('- Antiga - http://x/1\n- Antiga');
  });

  it('separa as issues pelas seções do tipo', () => {
    const documento = montarDescricaoDoRelease(null, [
      issue({ id: 1, titulo: 'Feature', url: 'http://x/1', tipos: ['melhoria'] }),
      issue({ id: 2, titulo: 'Correção', url: 'http://x/2', tipos: ['bug'] }),
      issue({ id: 3, titulo: 'Lenta', url: 'http://x/3', tipos: ['performance'] }),
      issue({ id: 4, titulo: 'Interno', url: 'http://x/4', tipos: ['deploy'] }),
    ]);

    expect(documento).toContain('## :gear: Features\n\n- Feature - http://x/1 (novo)');
    expect(documento).toContain('## :tools: Bug fixes\n\n- Correção - http://x/2 (novo)');
    expect(documento).toContain('## :rocket: Performance\n\n- Lenta - http://x/3 (novo)');
    expect(documento).toContain('## :game_die: Cards Técnicos\n\n- Interno - http://x/4 (novo)');
  });
});
