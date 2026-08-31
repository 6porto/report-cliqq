import { useMemo } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useMilestonesEmDesenvolvimento } from '../api/hooks';
import { MilestoneDeDesenvolvimento } from '../componentes/MilestoneDeDesenvolvimento';
import { montarPaletaDeEstados, rotuloDoEstado } from '../dominio/estados';

export function Desenvolvimento() {
  const milestones = useMilestonesEmDesenvolvimento();
  const lista = milestones.data ?? [];
  const issues = lista.reduce((soma, milestone) => soma + milestone.total, 0);

  /* A paleta sai de todas as milestones juntas: o mesmo estado tem a mesma cor
     na tela inteira, não uma cor por seção. */
  const paleta = useMemo(
    () => montarPaletaDeEstados(lista.flatMap((milestone) => milestone.issues.map((i) => i.estado))),
    [lista],
  );

  return (
    <>
      <div className="barra-sincronizacao">
        <div>
          <button
            type="button"
            className="aba primario"
            disabled={milestones.isFetching}
            onClick={() => void milestones.refetch()}
          >
            {milestones.isFetching ? 'Atualizando…' : 'Atualizar do GitLab'}
          </button>
          {lista.length > 0 && !milestones.isFetching ? (
            <span className="aviso-sincronizacao">
              {lista.length} {lista.length === 1 ? 'milestone aberta' : 'milestones abertas'} ·{' '}
              {issues} {issues === 1 ? 'issue' : 'issues'}
            </span>
          ) : null}
        </div>
        <p className="subtitulo">
          Milestones abertas <code>fix/*</code> e <code>release/*</code> de{' '}
          <code>mercantil/mercantil</code>, com todas as issues de cada uma
        </p>
      </div>

      {milestones.isError ? <p className="erro">{mensagemDoErro(milestones.error)}</p> : null}
      {milestones.isLoading ? <p className="carregando">Carregando…</p> : null}
      {!milestones.isLoading && !milestones.isError && lista.length === 0 ? (
        <p className="carregando">Nenhuma milestone aberta com prefixo fix/ ou release/.</p>
      ) : null}

      {paleta.size > 0 ? (
        <ul className="legenda-estados">
          {[...paleta].map(([estado, cor]) => (
            <li className="badge" key={estado}>
              <span className="marca" style={{ background: cor }} />
              {rotuloDoEstado(estado)}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="desenvolvimento">
        {lista.map((milestone) => (
          <MilestoneDeDesenvolvimento key={milestone.id} milestone={milestone} paleta={paleta} />
        ))}
      </div>
    </>
  );
}
