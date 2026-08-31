import { useId, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useFecharMilestone } from '../api/hooks';
import type { IssueDaVersao, MilestoneEmDesenvolvimento } from '../api/tipos';
import { corDoEstado, rotuloDoEstado, type PaletaDeEstados } from '../dominio/estados';
import { ROTULO_TIPO_DE_VERSAO, periodoDaVersao, tipoDaVersao } from '../dominio/versao';

function LinhaDaIssue({ issue, paleta }: { issue: IssueDaVersao; paleta: PaletaDeEstados }) {
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
        <span className="marca" style={{ background: corDoEstado(paleta, issue.estado) }} />
        {rotuloDoEstado(issue.estado)}
      </span>
      <span className="issue-responsavel">{issue.responsavel ?? '—'}</span>
      {issue.situacao === 'fechada' ? <span className="issue-fechada">fechada</span> : null}
    </li>
  );
}

export function MilestoneDeDesenvolvimento({
  milestone,
  paleta,
}: {
  milestone: MilestoneEmDesenvolvimento;
  paleta: PaletaDeEstados;
}) {
  const tipo = tipoDaVersao(milestone.titulo);
  const concluido = milestone.total === 0 ? 0 : (milestone.fechadas / milestone.total) * 100;
  const [aberta, setAberta] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const idDoCorpo = useId();
  const fechar = useFecharMilestone();

  /** Só dá para encerrar a milestone quando nenhuma issue ficou para trás. */
  const podeFechar = milestone.total > 0 && milestone.abertas === 0;

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

        <div className="milestone-acoes">
          <button
            type="button"
            className="aba"
            disabled={!podeFechar || fechar.isPending}
            title={
              podeFechar
                ? undefined
                : `${milestone.abertas} ${milestone.abertas === 1 ? 'issue ainda aberta' : 'issues ainda abertas'}`
            }
            onClick={() => setConfirmando(true)}
          >
            {fechar.isPending ? 'Fechando…' : 'Fechar milestone'}
          </button>

          <button
            type="button"
            className="milestone-alternar"
            aria-expanded={aberta}
            aria-controls={idDoCorpo}
            onClick={() => setAberta((atual) => !atual)}
          >
            <span aria-hidden>{aberta ? '▾' : '▸'}</span>
            {aberta ? 'Recolher' : `Ver ${milestone.total === 1 ? 'a issue' : 'as issues'}`}
          </button>
        </div>
      </header>

      {fechar.isError ? <p className="erro">{mensagemDoErro(fechar.error)}</p> : null}

      <div id={idDoCorpo} hidden={!aberta}>
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
              <LinhaDaIssue key={issue.id} issue={issue} paleta={paleta} />
            ))}
          </ul>
        )}
      </div>

      {confirmando ? (
        <div className="modal-fundo" onClick={() => setConfirmando(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Fechar a milestone ${milestone.titulo}`}
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="modal-cabecalho">
              <h2>Fechar {milestone.titulo}?</h2>
            </header>
            <p>
              As {milestone.total} issues estão concluídas. Fechar encerra a milestone no GitLab e
              ela sai desta lista.
            </p>
            <div className="assistente-acoes">
              <button type="button" className="aba" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="aba primario"
                onClick={() => {
                  setConfirmando(false);
                  fechar.mutate(milestone.id);
                }}
              >
                Fechar milestone
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
