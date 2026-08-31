import { useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useMilestonesEmDesenvolvimento } from '../api/hooks';
import { MilestoneDeDesenvolvimento } from '../componentes/MilestoneDeDesenvolvimento';
import { montarPaletaDeEstados, rotuloDoEstado } from '../dominio/estados';
import { tipoDaVersao, type TipoDeVersao } from '../dominio/versao';

const ABAS: { tipo: TipoDeVersao; rotulo: string; prefixo: string }[] = [
  { tipo: 'release', rotulo: 'Entregas', prefixo: 'release/' },
  { tipo: 'fix', rotulo: 'Correções', prefixo: 'fix/' },
];

export function Desenvolvimento() {
  const milestones = useMilestonesEmDesenvolvimento();
  const [aba, setAba] = useState<TipoDeVersao>('release');
  const todas = milestones.data ?? [];
  const lista = todas.filter((milestone) => tipoDaVersao(milestone.titulo) === aba);
  const issues = lista.reduce((soma, milestone) => soma + milestone.total, 0);

  /* A paleta sai de todas as milestones juntas: o mesmo estado tem a mesma cor
     na tela inteira, não uma cor por seção nem por aba. */
  const paleta = useMemo(
    () => montarPaletaDeEstados(todas.flatMap((milestone) => milestone.issues.map((i) => i.estado))),
    [todas],
  );

  /** A legenda só mostra o que está em cena na aba aberta. */
  const naAba = new Set(
    lista.flatMap((milestone) =>
      milestone.issues.map((issue) => issue.estado).filter((estado): estado is string => !!estado),
    ),
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
          Milestones abertas de <code>mercantil/mercantil</code>, com todas as issues de cada uma
        </p>
      </div>

      <div className="abas abas-de-versao">
        {ABAS.map(({ tipo, rotulo, prefixo }) => {
          const quantas = todas.filter((milestone) => tipoDaVersao(milestone.titulo) === tipo).length;

          return (
            <button
              key={tipo}
              type="button"
              className="aba"
              aria-current={aba === tipo ? 'page' : undefined}
              onClick={() => setAba(tipo)}
            >
              {rotulo} <code>{prefixo}</code>
              <span className="aba-contador">{quantas}</span>
            </button>
          );
        })}
      </div>

      {milestones.isError ? <p className="erro">{mensagemDoErro(milestones.error)}</p> : null}
      {milestones.isLoading ? <p className="carregando">Carregando…</p> : null}
      {!milestones.isLoading && !milestones.isError && lista.length === 0 ? (
        <p className="carregando">
          Nenhuma milestone aberta com prefixo {aba === 'fix' ? 'fix/' : 'release/'}.
        </p>
      ) : null}

      {naAba.size > 0 ? (
        <ul className="legenda-estados">
          {[...paleta]
            .filter(([estado]) => naAba.has(estado))
            .map(([estado, cor]) => (
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
