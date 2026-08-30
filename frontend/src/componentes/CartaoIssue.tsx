import type { IssueDaVersao } from '../api/tipos';
import { ROTULO_SITUACAO, formatarData } from '../dominio/versao';

interface Props {
  issue: IssueDaVersao;
}

export function CartaoIssue({ issue }: Props) {
  const fechada = issue.situacao === 'fechada';

  return (
    <article className={fechada ? 'issue issue-fechada' : 'issue'}>
      <header className="issue-cabecalho">
        <a className="issue-numero" href={issue.url} target="_blank" rel="noreferrer">
          #{issue.id}
        </a>
        <span className={fechada ? 'selo selo-pronto' : 'selo selo-pendente'}>
          {fechada ? '✓' : '○'} {ROTULO_SITUACAO[issue.situacao]}
        </span>
      </header>

      <h4 className="issue-titulo">
        <a href={issue.url} target="_blank" rel="noreferrer">
          {issue.titulo}
        </a>
      </h4>

      {issue.tipos.length > 0 ? (
        <div className="issue-tipos">
          {issue.tipos.map((tipo) => (
            <span key={tipo} className="selo selo-tipo">
              {tipo}
            </span>
          ))}
        </div>
      ) : null}

      <dl className="issue-dados">
        <div>
          <dt>Estado</dt>
          <dd>{issue.estado ?? '—'}</dd>
        </div>
        <div>
          <dt>Sistema</dt>
          <dd>{issue.sistema ?? '—'}</dd>
        </div>
        <div>
          <dt>Responsável</dt>
          <dd>{issue.responsavel ?? 'sem responsável'}</dd>
        </div>
      </dl>

      <footer className="issue-datas">
        <span>criada {formatarData(issue.criadaEm)}</span>
        <span>atualizada {formatarData(issue.atualizadaEm)}</span>
        {issue.fechadaEm ? <span>fechada {formatarData(issue.fechadaEm)}</span> : null}
      </footer>
    </article>
  );
}
