import { useEffect } from 'react';
import type { IssueDaVersao, RespostaPriorizacao } from '../api/tipos';
import {
  CRITERIOS_DE_VALOR,
  CRITERIO_DE_ESFORCO,
  FAIXAS_DE_CRITICIDADE,
  PERGUNTAS,
  respondidas,
  sugerirCriticidade,
  type CampoResposta,
  type Criticidade,
} from '../dominio/priorizacao';
import { classeDoTipo } from '../dominio/tipos-de-issue';

interface Props {
  issue: IssueDaVersao;
  resposta: RespostaPriorizacao | null;
  /** Escolha manual do usuário; nula enquanto vale a sugestão do sistema. */
  criticidade: Criticidade | null;
  /** Enquanto grava, os controles ficam travados. */
  salvando: boolean;
  erroAoSalvar: string | null;
  aoResponder: (campo: keyof RespostaPriorizacao, pontos: number) => void;
  aoEscolherCriticidade: (criticidade: Criticidade) => void;
  aoAplicar: (criticidade: Criticidade) => void;
  aoFechar: () => void;
}

/**
 * Todas as perguntas sobem da esquerda para a direita. O esforço nasce ao
 * contrário no domínio — a ordem de lá é o eixo do gráfico de priorização —,
 * então a inversão fica só na exibição.
 */
function emOrdemCrescente(opcoes: readonly { pontos: number; rotulo: string; apoio?: string }[]) {
  return [...opcoes].sort((uma, outra) => uma.pontos - outra.pontos);
}

/** Soma das cinco perguntas de valor mais o esforço, como na aba Priorização. */
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

/** Três traços preenchidos conforme o peso: lê a escala sem decorar os pontos. */
function Peso({ nivel }: { nivel: number }) {
  return (
    <span className="peso" data-nivel={nivel} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function Marca({ numero, respondida }: { numero: number; respondida: boolean }) {
  return (
    <span className="passo-marca" data-respondida={respondida}>
      {respondida ? (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        numero
      )}
    </span>
  );
}

export function ModalPriorizarIssue({
  issue,
  resposta,
  criticidade,
  salvando,
  erroAoSalvar,
  aoResponder,
  aoEscolherCriticidade,
  aoAplicar,
  aoFechar,
}: Props) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const { valor, esforco, score } = pontuacao(resposta);
  const feitas = respondidas(resposta);
  const sugerida = sugerirCriticidade(valor);
  const marcada = criticidade ?? sugerida;
  const escolhaFoiTrocada = criticidade !== null && sugerida !== null && criticidade !== sugerida;
  const resumoMarcado =
    FAIXAS_DE_CRITICIDADE.find((faixa) => faixa.criticidade === marcada)?.resumo ?? null;

  const botaoDaOpcao = (
    chave: CampoResposta,
    opcao: { pontos: number; rotulo: string; apoio?: string },
    nivel: number | null,
  ) => {
    const marcada = resposta?.[chave] === opcao.pontos;

    return (
      <button
        key={opcao.pontos}
        type="button"
        className="escala-opcao"
        aria-pressed={marcada}
        disabled={salvando}
        onClick={() => aoResponder(chave, opcao.pontos)}
      >
        <span className="escala-topo">
          {nivel === null ? null : <Peso nivel={nivel} />}
          <span className="escala-pontos">{opcao.pontos}</span>
        </span>
        <span className="escala-rotulo">{opcao.rotulo}</span>
        {opcao.apoio ? <span className="escala-apoio">{opcao.apoio}</span> : null}
      </button>
    );
  };

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal modal-triagem"
        role="dialog"
        aria-modal="true"
        aria-label={`Priorizar a issue ${issue.id}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="triagem-topo">
          <div className="triagem-identidade">
            <p className="triagem-eyebrow">Triagem</p>
            <h2 className="triagem-titulo">{issue.titulo}</h2>
            <p className="triagem-meta">
              <a href={issue.url} target="_blank" rel="noreferrer">
                #{issue.id}
              </a>
              {issue.tipos.map((tipo) => (
                <span className={`triagem-tipo ${classeDoTipo(tipo)}`.trim()} key={tipo}>
                  {tipo}
                </span>
              ))}
              {issue.estado ? <span>{issue.estado}</span> : null}
              {issue.autor ? <span>aberta por {issue.autor}</span> : null}
            </p>
          </div>
          <button className="triagem-fechar" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="triagem-progresso">
          <div
            className="triagem-barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={PERGUNTAS.length}
            aria-valuenow={feitas}
          >
            <span style={{ width: `${(feitas / PERGUNTAS.length) * 100}%` }} />
          </div>
          <p>
            {feitas} de {PERGUNTAS.length} respondidas
          </p>
        </div>

        <div className="triagem-corpo">
          <section className="bloco">
            <div className="bloco-cabecalho">
              <h3>Valor</h3>
              <p>Estas cinco respostas somam de 25 a 100 e definem a criticidade.</p>
            </div>

            <ol className="trilho">
              {CRITERIOS_DE_VALOR.map((pergunta, indice) => (
                <li className="passo" key={pergunta.chave}>
                  <Marca numero={indice + 1} respondida={resposta?.[pergunta.chave] != null} />
                  <fieldset>
                    <legend>{pergunta.pergunta}</legend>
                    <div className="escala escala-tripla">
                      {emOrdemCrescente(pergunta.opcoes).map((opcao, posicao) =>
                        botaoDaOpcao(pergunta.chave, opcao, posicao + 1),
                      )}
                    </div>
                  </fieldset>
                </li>
              ))}
            </ol>
          </section>

          <section className="bloco">
            <div className="bloco-cabecalho">
              <h3>Custo</h3>
              <p>O esforço entra no score, mas não muda a criticidade.</p>
            </div>

            <ol className="trilho" start={CRITERIOS_DE_VALOR.length + 1}>
              <li className="passo">
                <Marca
                  numero={PERGUNTAS.length}
                  respondida={resposta?.[CRITERIO_DE_ESFORCO.chave] != null}
                />
                <fieldset>
                  <legend>{CRITERIO_DE_ESFORCO.pergunta}</legend>
                  <div className="escala escala-regua">
                    {emOrdemCrescente(CRITERIO_DE_ESFORCO.opcoes).map((opcao) =>
                      botaoDaOpcao(CRITERIO_DE_ESFORCO.chave, opcao, null),
                    )}
                  </div>
                </fieldset>
              </li>
            </ol>
          </section>
        </div>

        <footer className="veredito">
          {score === null ? (
            <p className="veredito-pendente">
              Faltam {PERGUNTAS.length - feitas} de {PERGUNTAS.length} respostas para fechar o
              score e sugerir a criticidade.
            </p>
          ) : (
            <>
              <div className="veredito-score">
                <strong>{score}</strong>
                <span>
                  valor {valor} + esforço {esforco}
                </span>
              </div>

              <fieldset className="veredito-criticidades">
                <legend>
                  Criticidade
                  {escolhaFoiTrocada ? <em> — sugerida era {sugerida}</em> : null}
                </legend>
                <div className="criticidades">
                  {FAIXAS_DE_CRITICIDADE.map((faixa) => (
                    <button
                      key={faixa.criticidade}
                      type="button"
                      className="criticidade"
                      data-criticidade={faixa.criticidade}
                      aria-pressed={marcada === faixa.criticidade}
                      disabled={salvando}
                      onClick={() => aoEscolherCriticidade(faixa.criticidade)}
                    >
                      <span className="criticidade-nome">{faixa.criticidade}</span>
                      <span className="criticidade-faixa">
                        {faixa.minimo}–{faixa.maximo}
                      </span>
                    </button>
                  ))}
                </div>
                {resumoMarcado ? <p className="criticidade-resumo">{resumoMarcado}</p> : null}
              </fieldset>
            </>
          )}

          {erroAoSalvar ? <p className="veredito-erro">{erroAoSalvar}</p> : null}

          <div className="veredito-acoes">
            <p>
              {marcada
                ? `Aplicar grava o label criticidade::${marcada} na issue e a tira do backlog.`
                : 'As respostas ficam só nesta tela até você aplicar a criticidade.'}
            </p>
            <div className="veredito-botoes">
              <button type="button" className="aba" onClick={aoFechar} disabled={salvando}>
                Cancelar
              </button>
              <button
                type="button"
                className="aba primario"
                disabled={!marcada || salvando}
                onClick={() => marcada && aoAplicar(marcada)}
              >
                {salvando ? 'Aplicando…' : marcada ? `Aplicar ${marcada}` : 'Aplicar'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
