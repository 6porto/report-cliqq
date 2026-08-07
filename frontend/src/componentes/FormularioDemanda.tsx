import type { DemandaPriorizada } from '../api/tipos';
import { PERGUNTAS, respondidas, type CampoResposta } from '../dominio/priorizacao';

interface Props {
  demanda: DemandaPriorizada;
  salvando: boolean;
  aoResponder: (campo: CampoResposta, pontos: number) => void;
}

export function FormularioDemanda({ demanda, salvando, aoResponder }: Props) {
  const total = respondidas(demanda.resposta);

  return (
    <article className="cartao demanda">
      <header className="demanda-cabecalho">
        <span className="demanda-id">#{demanda.id}</span>
        <p className="demanda-descricao">{demanda.descricao}</p>
        {demanda.completa ? (
          <span className="selo selo-pronto">Score {demanda.score}</span>
        ) : (
          <span className="selo selo-pendente">Pendente · {total}/{PERGUNTAS.length}</span>
        )}
      </header>

      <div className="perguntas">
        {PERGUNTAS.map((pergunta, indice) => (
          <fieldset className="pergunta" key={pergunta.chave}>
            <legend>
              {indice + 1}. {pergunta.pergunta}
            </legend>
            <div className="opcoes">
              {pergunta.opcoes.map((opcao) => {
                const marcada = demanda.resposta?.[pergunta.chave] === opcao.pontos;

                return (
                  <button
                    key={opcao.pontos}
                    type="button"
                    className={marcada ? 'opcao opcao-marcada' : 'opcao'}
                    aria-pressed={marcada}
                    disabled={salvando}
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
    </article>
  );
}
