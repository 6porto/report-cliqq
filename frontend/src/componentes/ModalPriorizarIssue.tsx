import { useEffect } from 'react';
import type { IssueDaVersao, RespostaPriorizacao } from '../api/tipos';
import {
  CRITERIOS_DE_VALOR,
  CRITERIO_DE_ESFORCO,
  PERGUNTAS,
  respondidas,
} from '../dominio/priorizacao';

interface Props {
  issue: IssueDaVersao;
  resposta: RespostaPriorizacao | null;
  aoResponder: (campo: keyof RespostaPriorizacao, pontos: number) => void;
  aoFechar: () => void;
}

/**
 * Todas as perguntas sobem da esquerda para a direita. O esforço nasce ao
 * contrário no domínio — a ordem de lá é o eixo do gráfico de priorização —,
 * então a inversão fica só na exibição.
 */
function emOrdemCrescente(opcoes: readonly { pontos: number; rotulo: string }[]) {
  return [...opcoes].sort((uma, outra) => uma.pontos - outra.pontos);
}

/** Soma das quatro perguntas de valor mais o esforço, como na aba Priorização. */
export function pontuacao(resposta: RespostaPriorizacao | null) {
  if (!resposta) {
    return { valor: null, esforco: null, score: null };
  }

  const valores = CRITERIOS_DE_VALOR.map((criterio) => resposta[criterio.chave]);
  const esforco = resposta[CRITERIO_DE_ESFORCO.chave];

  if (valores.some((ponto) => ponto === null) || esforco === null) {
    return { valor: null, esforco: null, score: null };
  }

  const valor = valores.reduce((soma: number, ponto) => soma + (ponto ?? 0), 0);

  return { valor, esforco, score: valor + esforco };
}

export function ModalPriorizarIssue({ issue, resposta, aoResponder, aoFechar }: Props) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const { score } = pontuacao(resposta);
  const feitas = respondidas(resposta);

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal modal-largo"
        role="dialog"
        aria-modal="true"
        aria-label={`Priorizar a issue ${issue.id}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <div className="demanda-cabecalho">
            <a className="demanda-id" href={issue.url} target="_blank" rel="noreferrer">
              #{issue.id}
            </a>
            {issue.tipos.map((tipo) => (
              <span className="selo selo-tipo" key={tipo}>
                {tipo}
              </span>
            ))}
            {issue.estado ? <span className="selo">{issue.estado}</span> : null}
            {score === null ? (
              <span className="selo selo-pendente">
                Pendente · {feitas}/{PERGUNTAS.length}
              </span>
            ) : (
              <span className="selo selo-pronto">Score {score}</span>
            )}
          </div>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <p className="demanda-descricao">{issue.titulo}</p>

        <div className="perguntas">
          {PERGUNTAS.map((pergunta, indice) => (
            <fieldset className="pergunta" key={pergunta.chave}>
              <legend>
                {indice + 1}. {pergunta.pergunta}
              </legend>
              <div className="opcoes">
                {emOrdemCrescente(pergunta.opcoes).map((opcao) => {
                  const marcada = resposta?.[pergunta.chave] === opcao.pontos;

                  return (
                    <button
                      key={opcao.pontos}
                      type="button"
                      className={marcada ? 'opcao opcao-marcada' : 'opcao'}
                      aria-pressed={marcada}
                      onClick={() => aoResponder(pergunta.chave, opcao.pontos)}
                    >
                      <span>{opcao.rotulo}</span>
                      <span className="opcao-pontos">{opcao.pontos}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <p className="assistente-apoio">
          As respostas ficam só nesta tela por enquanto: ainda não são gravadas.
        </p>

        <div className="acoes-form">
          <button type="button" className="aba primario" onClick={aoFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
