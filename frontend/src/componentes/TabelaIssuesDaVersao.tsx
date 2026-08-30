import type { IssueDaVersao } from '../api/tipos';
import {
  ROTULO_SITUACAO,
  formatarData,
  ordenarIssues,
  type ColunaIssue,
  type OrdenacaoIssues,
} from '../dominio/versao';

interface Props {
  issues: IssueDaVersao[];
  ordenacao: OrdenacaoIssues;
  aoOrdenar: (coluna: ColunaIssue) => void;
}

const COLUNAS: { coluna: ColunaIssue; rotulo: string }[] = [
  { coluna: 'id', rotulo: 'Issue' },
  { coluna: 'titulo', rotulo: 'Título' },
  { coluna: 'tipo', rotulo: 'Tipo' },
  { coluna: 'estado', rotulo: 'Estado' },
  { coluna: 'sistema', rotulo: 'Sistema' },
  { coluna: 'responsavel', rotulo: 'Responsável' },
  { coluna: 'situacao', rotulo: 'Situação' },
  { coluna: 'atualizadaEm', rotulo: 'Datas' },
];

export function TabelaIssuesDaVersao({ issues, ordenacao, aoOrdenar }: Props) {
  const ordenadas = ordenarIssues(issues, ordenacao);

  return (
    <div className="tabela-envolucro">
      <table>
        <thead>
          <tr>
            {COLUNAS.map((coluna) => {
              const ativa = ordenacao.coluna === coluna.coluna;

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
          {ordenadas.map((issue) => (
            <tr key={issue.id}>
              <td>
                <a href={issue.url} target="_blank" rel="noreferrer">
                  #{issue.id}
                </a>
              </td>
              <td className="celula-titulo">
                <a href={issue.url} target="_blank" rel="noreferrer">
                  {issue.titulo}
                </a>
              </td>
              <td>{issue.tipo ?? '—'}</td>
              <td>{issue.estado ?? '—'}</td>
              <td>{issue.sistema ?? '—'}</td>
              <td>{issue.responsavel ?? '—'}</td>
              <td>
                <span
                  className={
                    issue.situacao === 'fechada' ? 'selo selo-pronto' : 'selo selo-pendente'
                  }
                >
                  {issue.situacao === 'fechada' ? '✓' : '○'} {ROTULO_SITUACAO[issue.situacao]}
                </span>
              </td>
              <td className="celula-datas">
                <span>criada {formatarData(issue.criadaEm)}</span>
                <span>atualizada {formatarData(issue.atualizadaEm)}</span>
                {issue.fechadaEm ? <span>fechada {formatarData(issue.fechadaEm)}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
