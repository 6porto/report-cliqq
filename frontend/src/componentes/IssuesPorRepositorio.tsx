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

/** Já entram marcadas as issues que o time deixou aguardando release. */
function selecaoInicial(
  repositorios: RepositorioDaVersao[],
  porId: Map<number, IssueDaVersao>,
): Record<string, number[]> {
  const inicial: Record<string, number[]> = {};

  for (const repositorio of repositorios) {
    inicial[repositorio.caminho] = repositorio.issues.filter(
      (id) => porId.get(id)?.estado === ESTADO_PRONTO_PARA_TAG,
    );
  }

  return inicial;
}

export function IssuesPorRepositorio({ repositorios, issues }: Props) {
  const porId = useMemo(
    () => new Map(issues.map((issue) => [issue.id, issue])),
    [issues],
  );
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
    setSelecionadas((atual) => ({
      ...atual,
      [repositorio.caminho]:
        (atual[repositorio.caminho] ?? []).length === repositorio.issues.length
          ? []
          : [...repositorio.issues],
    }));

  const aberto = repositorios.find((repositorio) => repositorio.caminho === gerandoTagEm) ?? null;

  return (
    <div className="repositorios-detalhados">
      {repositorios.map((repositorio) => {
        const semVersionamento = ehRepositorioSemVersionamento(repositorio.caminho);
        const escolhidas = marcadas(repositorio.caminho);
        const todasMarcadas =
          repositorio.issues.length > 0 && escolhidas.length === repositorio.issues.length;

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
                    <button type="button" className="aba" onClick={() => alternarTodas(repositorio)}>
                      {todasMarcadas ? 'Desmarcar todas' : 'Marcar todas'}
                    </button>
                    <button
                      type="button"
                      className="aba primario"
                      disabled={escolhidas.length === 0}
                      onClick={() => setGerandoTagEm(repositorio.caminho)}
                    >
                      Gerar nova tag
                    </button>
                  </>
                )}
                <a className="aba" href={repositorio.urlTags} target="_blank" rel="noreferrer">
                  Ver tags
                </a>
              </div>
            </header>

            <ul className="issues-do-repositorio">
              {repositorio.issues.map((id) => {
                const issue = porId.get(id);
                const fechada = issue?.situacao === 'fechada';

                return (
                  <li key={id} className={fechada ? 'issue-linha issue-fechada' : 'issue-linha'}>
                    {semVersionamento ? null : (
                      <input
                        type="checkbox"
                        checked={escolhidas.includes(id)}
                        aria-label={`Incluir a issue ${id} na tag de ${repositorio.nome}`}
                        onChange={() => alternarIssue(repositorio.caminho, id)}
                      />
                    )}
                    <a
                      className="issue-numero"
                      href={issue?.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      #{id}
                    </a>
                    <span className="issue-linha-titulo">
                      {issue?.titulo ?? 'issue fora da versão'}
                    </span>
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
              })}
            </ul>
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
