import type { CampoOrdenavel, Filial, Ordenacao } from '../api/tipos';
import { BadgeStatus } from './BadgeStatus';

interface Props {
  filiais: Filial[];
  ordenacao: Ordenacao | null;
  aoOrdenar: (campo: CampoOrdenavel) => void;
  aoEditar: (filial: Filial) => void;
}

const COLUNAS: { campo: CampoOrdenavel; rotulo: string; numerica?: boolean }[] = [
  { campo: 'codigo', rotulo: 'Código' },
  { campo: 'cidade', rotulo: 'Cidade' },
  { campo: 'uf', rotulo: 'UF' },
  { campo: 'mediaOperacoes90Dias', rotulo: 'Méd. op. 90d', numerica: true },
  { campo: 'onda', rotulo: 'Onda' },
  { campo: 'status', rotulo: 'Status' },
  { campo: 'dataPrevista', rotulo: 'Previsto' },
  { campo: 'dataConclusao', rotulo: 'Concluído' },
];

function formatarData(valor: string | null) {
  return valor ? new Date(valor).toLocaleDateString('pt-BR') : '—';
}

export function TabelaFiliais({ filiais, ordenacao, aoOrdenar, aoEditar }: Props) {
  return (
    <div className="tabela-envolucro">
      <table>
        <thead>
          <tr>
            {COLUNAS.map((coluna) => {
              const ativa = ordenacao?.campo === coluna.campo;

              return (
                <th
                  key={coluna.campo}
                  aria-sort={
                    ativa ? (ordenacao.direcao === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <button
                    type="button"
                    className={ativa ? 'ordenar ordenar-ativa' : 'ordenar'}
                    onClick={() => aoOrdenar(coluna.campo)}
                  >
                    {coluna.rotulo}
                    <span aria-hidden>{ativa ? (ordenacao.direcao === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </button>
                </th>
              );
            })}
            <th />
          </tr>
        </thead>
        <tbody>
          {filiais.map((filial) => (
            <tr key={filial.id}>
              <td>{filial.codigo}</td>
              <td>{filial.cidade ?? '—'}</td>
              <td>{filial.uf ?? '—'}</td>
              <td>{filial.mediaOperacoes90Dias}</td>
              <td>{filial.onda ?? '—'}</td>
              <td>
                <BadgeStatus status={filial.status} />
              </td>
              <td>{formatarData(filial.dataPrevista)}</td>
              <td>{formatarData(filial.dataConclusao)}</td>
              <td>
                <button
                  className="aba"
                  onClick={() => aoEditar(filial)}
                  aria-label={`Editar loja ${filial.codigo}`}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
