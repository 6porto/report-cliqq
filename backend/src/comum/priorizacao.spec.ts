import {
  ESFORCO_INDEFINIDO,
  PONTOS_DE_ESFORCO,
  calcularPriorizacao,
  sugerirCriticidade,
  type RespostaPriorizacao,
} from './priorizacao';

class RespostaBuilder {
  private resposta: RespostaPriorizacao = {
    beneficiados: 20,
    tipoDeGanho: 10,
    frequencia: 20,
    riscoDeAdiar: 10,
    contorno: 10,
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
  it('soma as cinco perguntas de valor e acrescenta o esforço no score', () => {
    const resultado = calcularPriorizacao(new RespostaBuilder().build());

    expect(resultado.completa).toBe(true);
    expect(resultado.pontuacaoValor).toBe(70);
    expect(resultado.pontuacaoEsforco).toBe(20);
    expect(resultado.score).toBe(90);
  });

  it.each([
    [20, 0, 'até 1 dia', 1],
    [17, 1, 'até 3 dias', 3],
    [14, 2, 'até 1 semana', 5],
    [11, 3, 'até 2 semanas', 10],
    [8, 4, 'até 1 mês', 22],
    [5, 5, 'até 2 meses', 44],
    [2, 6, 'mais de 2 meses', 66],
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
    const resultado = calcularPriorizacao(new RespostaBuilder().com('esforco', 10).build());

    expect(resultado.completa).toBe(false);
  });

  it('não fecha o score com o esforço marcado como não estimável', () => {
    const resultado = calcularPriorizacao(
      new RespostaBuilder().com('esforco', ESFORCO_INDEFINIDO.pontos).build(),
    );

    expect(resultado.completa).toBe(false);
    expect(resultado.score).toBeNull();
  });

  it('mantém o não estimável fora do eixo do gráfico de priorização', () => {
    expect(PONTOS_DE_ESFORCO).not.toContain(ESFORCO_INDEFINIDO.pontos);
  });
});

describe('sugerirCriticidade', () => {
  it.each([
    [100, 'P1'],
    [85, 'P1'],
    [80, 'P2'],
    [65, 'P2'],
    [60, 'P3'],
    [45, 'P3'],
    [40, 'P4'],
    [25, 'P4'],
  ])('classifica a pontuação de valor %s como %s', (pontuacao, esperado) => {
    expect(sugerirCriticidade(pontuacao)).toBe(esperado);
  });

  it('não sugere nada enquanto a priorização está incompleta', () => {
    expect(sugerirCriticidade(null)).toBeNull();
  });
});
