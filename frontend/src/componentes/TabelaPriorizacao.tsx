import type { DemandaPriorizada } from '../api/tipos';
import {
  PERGUNTAS,
  ROTULO_TIPO,
  ordenarPorPrioridade,
  respondidas,
} from '../dominio/priorizacao';

interface Props {
  demandas: DemandaPriorizada[];
}

export function TabelaPriorizacao({ demandas }: Props) {
  const ordenadas = ordenarPorPrioridade(demandas);

  return (
    <div className="tabela-envolucro">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Issue</th>
            <th>Título</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Valor</th>
            <th>Esforço</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((demanda, indice) => (
            <tr key={demanda.id}>
              <td>{demanda.completa ? indice + 1 : '—'}</td>
              <td>
                <a href={demanda.url} target="_blank" rel="noreferrer">
                  #{demanda.id}
                </a>
              </td>
              <td className="celula-titulo">{demanda.titulo}</td>
              <td>{ROTULO_TIPO[demanda.tipo] ?? demanda.tipo}</td>
              <td>{demanda.estado ?? '—'}</td>
              <td>{demanda.pontuacaoValor ?? '—'}</td>
              <td>
                {demanda.rotuloEsforco
                  ? `${demanda.rotuloEsforco} (${demanda.pontuacaoEsforco})`
                  : '—'}
              </td>
              <td>
                {demanda.completa ? (
                  <strong>{demanda.score}</strong>
                ) : (
                  <span className="selo selo-pendente">
                    Pendente · {respondidas(demanda.resposta)}/{PERGUNTAS.length}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
