import type { IssueDaVersao, RepositorioDaVersao } from '../api/tipos';
import { ROTULO_SITUACAO } from '../dominio/versao';

interface Props {
  repositorios: RepositorioDaVersao[];
  issues: IssueDaVersao[];
}

export function IssuesPorRepositorio({ repositorios, issues }: Props) {
  const porId = new Map(issues.map((issue) => [issue.id, issue]));

  return (
    <div className="repositorios-detalhados">
      {repositorios.map((repositorio) => (
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
            <a className="aba" href={repositorio.urlTags} target="_blank" rel="noreferrer">
              Ver tags
            </a>
          </header>

          <ul className="issues-do-repositorio">
            {repositorio.issues.map((id) => {
              const issue = porId.get(id);
              const fechada = issue?.situacao === 'fechada';

              return (
                <li key={id} className={fechada ? 'issue-linha issue-fechada' : 'issue-linha'}>
                  <a
                    className="issue-numero"
                    href={issue?.url}
                    target="_blank"
                    rel="noreferrer"
                  >
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
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
