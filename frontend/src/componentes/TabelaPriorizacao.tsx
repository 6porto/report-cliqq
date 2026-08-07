import type { DemandaPriorizada } from '../api/tipos';
import { PERGUNTAS, ordenarPorPrioridade, respondidas } from '../dominio/priorizacao';

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
            <th>ID</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Esforço</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((demanda, indice) => (
            <tr key={demanda.id}>
              <td>{demanda.completa ? indice + 1 : '—'}</td>
              <td>{demanda.id}</td>
              <td className="celula-descricao">{demanda.descricao}</td>
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
