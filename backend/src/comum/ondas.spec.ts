import { ondaPorMediaDeOperacoes } from './ondas';

describe('ondaPorMediaDeOperacoes', () => {
  it.each([
    [95, 'Onda 1'],
    [40, 'Onda 1'],
    [39, 'Onda 2'],
    [20, 'Onda 2'],
    [19, 'Onda 3'],
    [0, 'Onda 3'],
  ])('média %i cai na %s', (media, esperado) => {
    expect(ondaPorMediaDeOperacoes(media)).toBe(esperado);
  });
});
