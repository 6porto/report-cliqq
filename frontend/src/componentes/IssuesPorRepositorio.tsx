import { useEffect, useMemo, useState } from 'react';
import type { IssueDaVersao, RepositorioDaVersao } from '../api/tipos';
import {
  ESTADO_PRONTO_PARA_TAG,
  ROTULO_SITUACAO,
  ehRepositorioSemVersionamento,
} from '../dominio/versao';
import { ModalNovaTag } from './ModalNovaTag';

interface Props {
  repositorios: RepositorioDaVersao[];
  issues: IssueDaVersao[];
}

/** Só entram na tag as issues que o time deixou aguardando release. */
function selecionaveis(repositorio: RepositorioDaVersao, porId: Map<number, IssueDaVersao>) {
  return repositorio.issues.filter((id) => porId.get(id)?.estado === ESTADO_PRONTO_PARA_TAG);
}

function naoSelecionaveis(repositorio: RepositorioDaVersao, porId: Map<number, IssueDaVersao>) {
  return repositorio.issues.filter((id) => porId.get(id)?.estado !== ESTADO_PRONTO_PARA_TAG);
}

function selecaoInicial(
  repositorios: RepositorioDaVersao[],
  porId: Map<number, IssueDaVersao>,
): Record<string, number[]> {
  const inicial: Record<string, number[]> = {};

  for (const repositorio of repositorios) {
    inicial[repositorio.caminho] = selecionaveis(repositorio, porId);
  }

  return inicial;
}

interface PropsDaLinha {
  id: number;
  issue: IssueDaVersao | undefined;
  selecao: { marcada: boolean; aoAlternar: () => void; rotulo: string } | null;
}

function LinhaDaIssue({ id, issue, selecao }: PropsDaLinha) {
  const fechada = issue?.situacao === 'fechada';
  const classes = ['issue-linha'];

  if (fechada) {
    classes.push('issue-fechada');
  }

  if (!selecao) {
    classes.push('issue-linha-sem-selecao');
  }

  return (
    <li className={classes.join(' ')}>
      {selecao ? (
        <input
          type="checkbox"
          checked={selecao.marcada}
          aria-label={selecao.rotulo}
          onChange={selecao.aoAlternar}
        />
      ) : null}
      <a className="issue-numero" href={issue?.url} target="_blank" rel="noreferrer">
        #{id}
      </a>
      <span className="issue-linha-titulo">{issue?.titulo ?? 'issue fora da versão'}</span>
      {issue ? (
        <span className="issue-linha-dados">
          <span className={fechada ? 'selo selo-pronto' : 'selo selo-pendente'}>
            {fechada ? '✓' : '○'} {ROTULO_SITUACAO[issue.situacao]}
          </span>
          <span>{issue.estado ?? 'sem estado'}</span>
          <span>{issue.responsavel ?? 'sem responsável'}</span>
        </span>
      ) : null}
    </li>
  );
}

export function IssuesPorRepositorio({ repositorios, issues }: Props) {
  const porId = useMemo(() => new Map(issues.map((issue) => [issue.id, issue])), [issues]);
  const [selecionadas, setSelecionadas] = useState<Record<string, number[]>>({});
  const [gerandoTagEm, setGerandoTagEm] = useState<string | null>(null);

  useEffect(() => {
    setSelecionadas(selecaoInicial(repositorios, porId));
  }, [repositorios, porId]);

  const marcadas = (caminho: string) => selecionadas[caminho] ?? [];

  const alternarIssue = (caminho: string, id: number) =>
    setSelecionadas((atual) => {
      const atuais = atual[caminho] ?? [];

      return {
        ...atual,
        [caminho]: atuais.includes(id)
          ? atuais.filter((marcada) => marcada !== id)
          : [...atuais, id],
      };
    });

  const alternarTodas = (repositorio: RepositorioDaVersao) =>
    setSelecionadas((atual) => {
      const disponiveis = selecionaveis(repositorio, porId);

      return {
        ...atual,
        [repositorio.caminho]:
          (atual[repositorio.caminho] ?? []).length === disponiveis.length ? [] : disponiveis,
      };
    });

  const aberto = repositorios.find((repositorio) => repositorio.caminho === gerandoTagEm) ?? null;

  return (
    <div className="repositorios-detalhados">
      {repositorios.map((repositorio) => {
        const semVersionamento = ehRepositorioSemVersionamento(repositorio.caminho);
        const escolhidas = marcadas(repositorio.caminho);
        const disponiveis = semVersionamento ? [] : selecionaveis(repositorio, porId);
        const restantes = semVersionamento
          ? repositorio.issues
          : naoSelecionaveis(repositorio, porId);
        const todasMarcadas =
          disponiveis.length > 0 && escolhidas.length === disponiveis.length;

        return (
          <section key={repositorio.caminho} className="repositorio-detalhado">
            <header className="repositorio-detalhado-cabecalho">
              <div className="repositorio-identificacao">
                <a
                  className="repositorio-nome"
                  href={repositorio.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {repositorio.nome}
                </a>
                <span className="repositorio-caminho">{repositorio.caminho}</span>
              </div>
              <div className="repositorio-acoes">
                {semVersionamento ? (
                  <span className="aviso-sincronizacao">versiona por aplicação</span>
                ) : (
                  <>
                    <button
                      type="button"
                      className="aba"
                      disabled={disponiveis.length === 0}
                      onClick={() => alternarTodas(repositorio)}
                    >
                      {todasMarcadas ? 'Desmarcar todas' : 'Marcar todas'}
                    </button>
                    <button
                      type="button"
                      className="aba primario"
                      disabled={escolhidas.length === 0}
                      onClick={() => setGerandoTagEm(repositorio.caminho)}
                    >
                      Gerar versão
                    </button>
                  </>
                )}
                <a className="aba" href={repositorio.urlTags} target="_blank" rel="noreferrer">
                  Ver tags
                </a>
              </div>
            </header>

            {disponiveis.length > 0 ? (
              <ul className="issues-do-repositorio">
                {disponiveis.map((id) => (
                  <LinhaDaIssue
                    key={id}
                    id={id}
                    issue={porId.get(id)}
                    selecao={{
                      marcada: escolhidas.includes(id),
                      rotulo: `Incluir a issue ${id} na tag de ${repositorio.nome}`,
                      aoAlternar: () => alternarIssue(repositorio.caminho, id),
                    }}
                  />
                ))}
              </ul>
            ) : null}

            {restantes.length > 0 ? (
              <>
                {semVersionamento ? null : (
                  <p className="aviso-sincronizacao">
                    Fora da tag — só issues em <code>{ESTADO_PRONTO_PARA_TAG}</code> podem ser
                    selecionadas
                  </p>
                )}
                <ul className="issues-do-repositorio">
                  {restantes.map((id) => (
                    <LinhaDaIssue key={id} id={id} issue={porId.get(id)} selecao={null} />
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        );
      })}

      {aberto ? (
        <ModalNovaTag
          repositorio={aberto}
          issues={marcadas(aberto.caminho)
            .map((id) => porId.get(id))
            .filter((issue): issue is IssueDaVersao => !!issue)
            .sort((a, b) => a.id - b.id)}
          aoFechar={() => setGerandoTagEm(null)}
        />
      ) : null}
    </div>
  );
}
