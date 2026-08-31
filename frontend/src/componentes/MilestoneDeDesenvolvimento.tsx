import type { IssueDaVersao, MilestoneEmDesenvolvimento } from '../api/tipos';
import { corDoEstado, rotuloDoEstado } from '../dominio/estados';
import { ROTULO_TIPO_DE_VERSAO, periodoDaVersao, tipoDaVersao } from '../dominio/versao';

function LinhaDaIssue({ issue }: { issue: IssueDaVersao }) {
  return (
    <li className="issue">
      <a className="issue-id" href={issue.url} target="_blank" rel="noreferrer">
        #{issue.id}
      </a>
      <span className="issue-titulo">{issue.titulo}</span>
      {issue.tipos.map((tipo) => (
        <span className="issue-marcador" key={tipo}>
          {tipo}
        </span>
      ))}
      {issue.sistema ? <span className="issue-marcador">{issue.sistema}</span> : null}
      <span className="issue-estado badge">
        <span className="marca" style={{ background: corDoEstado(issue.estado) }} />
        {rotuloDoEstado(issue.estado)}
      </span>
      <span className="issue-responsavel">{issue.responsavel ?? '—'}</span>
      {issue.situacao === 'fechada' ? <span className="issue-fechada">fechada</span> : null}
    </li>
  );
}

export function MilestoneDeDesenvolvimento({
  milestone,
}: {
  milestone: MilestoneEmDesenvolvimento;
}) {
  const tipo = tipoDaVersao(milestone.titulo);
  const concluido = milestone.total === 0 ? 0 : (milestone.fechadas / milestone.total) * 100;

  return (
    <section className={`milestone milestone-${tipo}`}>
      <header className="milestone-topo">
        <div>
          <h2 className="milestone-titulo">
            <a href={milestone.url} target="_blank" rel="noreferrer">
              {milestone.titulo}
            </a>
            <span className="selo-tipo-versao">{ROTULO_TIPO_DE_VERSAO[tipo]}</span>
          </h2>
          <p className="milestone-periodo">{periodoDaVersao(milestone)}</p>
        </div>

        <div className="milestone-progresso">
          <p className="milestone-contador">
            {milestone.fechadas} de {milestone.total}{' '}
            {milestone.total === 1 ? 'concluída' : 'concluídas'}
          </p>
          <div
            className="milestone-barra"
            role="img"
            aria-label={`${Math.round(concluido)}% das issues concluídas`}
          >
            <span style={{ width: `${concluido}%` }} />
          </div>
        </div>
      </header>

      {milestone.tags.length > 0 ? (
        <ul className="milestone-tags">
          {milestone.tags.map((tag) => (
            <li key={`${tag.repositorio}-${tag.tag}`}>
              <span className="milestone-repo">{tag.repositorio}</span>
              {tag.url ? (
                <a href={tag.url} target="_blank" rel="noreferrer">
                  {tag.tag}
                </a>
              ) : (
                <span>{tag.tag}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {milestone.issues.length === 0 ? (
        <p className="milestone-vazia">Milestone aberta, mas ainda sem issues.</p>
      ) : (
        <ul className="issues">
          {milestone.issues.map((issue) => (
            <LinhaDaIssue key={issue.id} issue={issue} />
          ))}
        </ul>
      )}
    </section>
  );
}
