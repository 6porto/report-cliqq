import { useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useBacklogSemCriticidade } from '../api/hooks';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { classeDoTipo } from '../dominio/tipos-de-issue';

const PERIODOS: { rotulo: string; dias: number | null }[] = [
  { rotulo: '7 dias', dias: 7 },
  { rotulo: '15 dias', dias: 15 },
  { rotulo: '30 dias', dias: 30 },
  { rotulo: 'Tudo', dias: null },
];

/** Quantas linhas aparecem antes do "ver mais" — o backlog inteiro passa de 190. */
const POR_VEZ = 50;

function formatarData(valor: string) {
  return new Date(valor).toLocaleDateString('pt-BR');
}

export function Backlog() {
  const [dias, setDias] = useState<number | null>(7);
  const [visiveis, setVisiveis] = useState(POR_VEZ);
  const backlog = useBacklogSemCriticidade(dias);

  const issues = backlog.data?.issues ?? [];
  const mostradas = issues.slice(0, visiveis);

  const trocarPeriodo = (novo: number | null) => {
    setDias(novo);
    setVisiveis(POR_VEZ);
  };

  return (
    <CartaoGrafico
      largo
      titulo="Sem criticidade definida"
      subtitulo="Issues abertas que passaram pela triagem sem receber criticidade::"
      acoes={
        <div className="filtros">
          {PERIODOS.map((periodo) => (
            <button
              key={periodo.rotulo}
              type="button"
              className="aba"
              aria-current={dias === periodo.dias ? 'true' : undefined}
              onClick={() => trocarPeriodo(periodo.dias)}
            >
              {periodo.rotulo}
            </button>
          ))}
        </div>
      }
    >
      {backlog.isError ? <p className="erro">{mensagemDoErro(backlog.error)}</p> : null}
      {backlog.isLoading ? <p className="carregando">Carregando o backlog…</p> : null}

      {backlog.data ? (
        <p className="assistente-apoio nota-da-etapa">
          <strong>{issues.length}</strong> de {backlog.data.total} issues abertas{' '}
          {dias === null ? 'no projeto' : `nos últimos ${dias} dias`} estão sem criticidade.
        </p>
      ) : null}

      {backlog.data && issues.length === 0 ? (
        <p className="carregando">
          Todas as issues do período já têm criticidade — nada para triar aqui.
        </p>
      ) : null}

      {issues.length > 0 ? (
        <>
          <div className="tabela-envolucro">
            <table>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Sistema</th>
                  <th>Estado</th>
                  <th>Responsável</th>
                  <th>Criada em</th>
                </tr>
              </thead>
              <tbody>
                {mostradas.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <a className="issue-id" href={issue.url} target="_blank" rel="noreferrer">
                        #{issue.id}
                      </a>
                    </td>
                    <td className="celula-titulo">{issue.titulo}</td>
                    <td>
                      {issue.tipos.length > 0
                        ? issue.tipos.map((tipo) => (
                            <span
                              className={`issue-marcador ${classeDoTipo(tipo)}`.trim()}
                              key={tipo}
                            >
                              {tipo}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td>{issue.sistema ?? '—'}</td>
                    <td>{issue.estado ?? '—'}</td>
                    <td>{issue.responsavel ?? '—'}</td>
                    <td>{formatarData(issue.criadaEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {issues.length > mostradas.length ? (
            <button
              type="button"
              className="aba"
              onClick={() => setVisiveis((atual) => atual + POR_VEZ)}
            >
              Ver mais {Math.min(POR_VEZ, issues.length - mostradas.length)} de{' '}
              {issues.length - mostradas.length} restantes
            </button>
          ) : null}
        </>
      ) : null}
    </CartaoGrafico>
  );
}
