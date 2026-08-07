import type { DemandaPriorizada } from '../api/tipos';
import {
  CRITERIO_DE_ESFORCO,
  PERGUNTAS,
  ROTULO_TIPO,
  ordenarRanking,
  respondidas,
  type ColunaOrdenavel,
  type OrdenacaoRanking,
} from '../dominio/priorizacao';

interface Props {
  demandas: DemandaPriorizada[];
  posicoes: Map<number, number>;
  ordenacao: OrdenacaoRanking | null;
  salvandoId: number | null;
  aoOrdenar: (coluna: ColunaOrdenavel) => void;
  aoVoltarParaORanking: () => void;
  aoAlterarEsforco: (demandaId: number, pontos: number) => void;
  aoAbrir: (demandaId: number) => void;
}

const COLUNAS: { coluna: ColunaOrdenavel; rotulo: string }[] = [
  { coluna: 'id', rotulo: 'Issue' },
  { coluna: 'titulo', rotulo: 'Título' },
  { coluna: 'tipo', rotulo: 'Tipo' },
  { coluna: 'estado', rotulo: 'Estado' },
  { coluna: 'pontuacaoValor', rotulo: 'Valor' },
  { coluna: 'posicaoEsforco', rotulo: 'Esforço' },
  { coluna: 'score', rotulo: 'Score' },
];

export function TabelaPriorizacao({
  demandas,
  posicoes,
  ordenacao,
  salvandoId,
  aoOrdenar,
  aoVoltarParaORanking,
  aoAlterarEsforco,
  aoAbrir,
}: Props) {
  const ordenadas = ordenarRanking(demandas, ordenacao);

  return (
    <div className="tabela-envolucro">
      <table>
        <thead>
          <tr>
            <th aria-sort={ordenacao ? 'none' : 'descending'}>
              <button
                type="button"
                className={ordenacao ? 'ordenar' : 'ordenar ordenar-ativa'}
                onClick={aoVoltarParaORanking}
                title="Voltar à ordem do ranking"
              >
                #<span aria-hidden>{ordenacao ? '↕' : '▼'}</span>
              </button>
            </th>
            {COLUNAS.map((coluna) => {
              const ativa = ordenacao?.coluna === coluna.coluna;

              return (
                <th
                  key={coluna.coluna}
                  aria-sort={
                    ativa ? (ordenacao.direcao === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <button
                    type="button"
                    className={ativa ? 'ordenar ordenar-ativa' : 'ordenar'}
                    onClick={() => aoOrdenar(coluna.coluna)}
                  >
                    {coluna.rotulo}
                    <span aria-hidden>
                      {ativa ? (ordenacao.direcao === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((demanda) => (
            <tr key={demanda.id}>
              <td>{posicoes.get(demanda.id) ?? '—'}</td>
              <td>
                <a href={demanda.url} target="_blank" rel="noreferrer">
                  #{demanda.id}
                </a>
              </td>
              <td className="celula-titulo">{demanda.titulo}</td>
              <td>{ROTULO_TIPO[demanda.tipo] ?? demanda.tipo}</td>
              <td>{demanda.estado ?? '—'}</td>
              <td>{demanda.pontuacaoValor ?? '—'}</td>
              <td className="celula-esforco">
                <select
                  value={demanda.resposta?.esforco ?? ''}
                  disabled={salvandoId === demanda.id}
                  aria-label={`Esforço da demanda ${demanda.id}`}
                  onChange={(evento) =>
                    evento.target.value
                      ? aoAlterarEsforco(demanda.id, Number(evento.target.value))
                      : undefined
                  }
                >
                  <option value="">—</option>
                  {CRITERIO_DE_ESFORCO.opcoes.map((opcao) => (
                    <option key={opcao.pontos} value={opcao.pontos}>
                      {opcao.rotulo} ({opcao.pontos})
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  type="button"
                  className="ligacao"
                  onClick={() => aoAbrir(demanda.id)}
                  title="Abrir as perguntas de priorização"
                >
                  {demanda.completa ? (
                    <strong>{demanda.score}</strong>
                  ) : (
                    <span className="selo selo-pendente">
                      Pendente · {respondidas(demanda.resposta)}/{PERGUNTAS.length}
                    </span>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
