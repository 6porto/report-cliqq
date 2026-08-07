import type { DemandaPriorizada } from '../api/tipos';
import { PERGUNTAS, ROTULO_TIPO, respondidas, type CampoResposta } from '../dominio/priorizacao';

interface Props {
  demanda: DemandaPriorizada;
  salvando: boolean;
  temProximaPendente: boolean;
  aoResponder: (campo: CampoResposta, pontos: number) => void;
  aoIrParaProximaPendente: () => void;
  aoFechar: () => void;
}

export function ModalDemanda({
  demanda,
  salvando,
  temProximaPendente,
  aoResponder,
  aoIrParaProximaPendente,
  aoFechar,
}: Props) {
  const total = respondidas(demanda.resposta);

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Priorizar demanda ${demanda.id}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <div className="demanda-cabecalho">
            <a className="demanda-id" href={demanda.url} target="_blank" rel="noreferrer">
              #{demanda.id}
            </a>
            <span className="selo selo-tipo">{ROTULO_TIPO[demanda.tipo] ?? demanda.tipo}</span>
            {demanda.estado ? <span className="selo">{demanda.estado}</span> : null}
            {demanda.completa ? (
              <span className="selo selo-pronto">Score {demanda.score}</span>
            ) : (
              <span className="selo selo-pendente">
                Pendente · {total}/{PERGUNTAS.length}
              </span>
            )}
          </div>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <p className="demanda-descricao">{demanda.titulo}</p>

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

        <div className="acoes-form">
          <button
            type="button"
            className="aba primario"
            disabled={!temProximaPendente}
            onClick={aoIrParaProximaPendente}
          >
            Próxima pendente
          </button>
          <button type="button" className="aba" onClick={aoFechar}>
            Fechar
          </button>
          <span className="aviso">A resposta é salva na hora; vale sempre a última.</span>
        </div>
      </div>
    </div>
  );
}
