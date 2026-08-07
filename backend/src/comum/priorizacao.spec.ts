import { calcularPriorizacao, type RespostaPriorizacao } from './priorizacao';

class RespostaBuilder {
  private resposta: RespostaPriorizacao = {
    beneficiados: 20,
    tipoDeGanho: 10,
    frequencia: 20,
    riscoDeAdiar: 10,
    esforco: 20,
  };

  com(campo: keyof RespostaPriorizacao, valor: number | null): this {
    this.resposta = { ...this.resposta, [campo]: valor };
    return this;
  }

  build(): RespostaPriorizacao {
    return { ...this.resposta };
  }
}

describe('calcularPriorizacao', () => {
  it('soma as quatro primeiras perguntas no valor e acrescenta o esforço no score', () => {
    const resultado = calcularPriorizacao(new RespostaBuilder().build());

    expect(resultado.completa).toBe(true);
    expect(resultado.pontuacaoValor).toBe(60);
    expect(resultado.pontuacaoEsforco).toBe(20);
    expect(resultado.score).toBe(80);
  });

  it.each([
    [20, 0, 'Alguns dias', 3],
    [10, 1, '1 semana ou mais', 7],
    [5, 2, '1 mês ou mais', 30],
  ])(
    'esforço de %i pontos fica na posição %i do eixo (%s)',
    (pontos, posicao, rotulo, dias) => {
      const resultado = calcularPriorizacao(
        new RespostaBuilder().com('esforco', pontos).build(),
      );

      expect(resultado.posicaoEsforco).toBe(posicao);
      expect(resultado.rotuloEsforco).toBe(rotulo);
      expect(resultado.dias).toBe(dias);
    },
  );

  it.each([
    ['beneficiados'],
    ['tipoDeGanho'],
    ['frequencia'],
    ['riscoDeAdiar'],
    ['esforco'],
  ])('fica incompleta quando %s não foi respondida', (campo) => {
    const resultado = calcularPriorizacao(
      new RespostaBuilder().com(campo as keyof RespostaPriorizacao, null).build(),
    );

    expect(resultado.completa).toBe(false);
    expect(resultado.score).toBeNull();
    expect(resultado.pontuacaoValor).toBeNull();
  });

  it('trata demanda sem nenhuma resposta como incompleta', () => {
    const resultado = calcularPriorizacao(null);

    expect(resultado.completa).toBe(false);
    expect(resultado.rotuloEsforco).toBeNull();
  });

  it('ignora esforço fora da escala', () => {
    const resultado = calcularPriorizacao(new RespostaBuilder().com('esforco', 7).build());

    expect(resultado.completa).toBe(false);
  });
});
