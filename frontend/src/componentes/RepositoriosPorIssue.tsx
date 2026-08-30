import type { IssueDaVersao, RepositorioDaVersao } from '../api/tipos';
import { ROTULO_SITUACAO } from '../dominio/versao';

interface Props {
  issues: IssueDaVersao[];
  repositorios: RepositorioDaVersao[];
}

/** Inverte o agrupamento que vem do backend: de repositório→issues para issue→repositórios. */
function repositoriosPorIssue(repositorios: RepositorioDaVersao[]) {
  const porIssue = new Map<number, RepositorioDaVersao[]>();

  for (const repositorio of repositorios) {
    for (const id of repositorio.issues) {
      porIssue.set(id, [...(porIssue.get(id) ?? []), repositorio]);
    }
  }

  return porIssue;
}

export function RepositoriosPorIssue({ issues, repositorios }: Props) {
  const porIssue = repositoriosPorIssue(repositorios);
  const ordenadas = [...issues].sort((a, b) => a.id - b.id);

  return (
    <div className="issues-detalhadas">
      {ordenadas.map((issue) => {
        const envolvidos = porIssue.get(issue.id) ?? [];
        const fechada = issue.situacao === 'fechada';

        return (
          <section key={issue.id} className="issue-detalhada">
            <header className="issue-detalhada-cabecalho">
              <a className="issue-numero" href={issue.url} target="_blank" rel="noreferrer">
                #{issue.id}
              </a>
              <span className={fechada ? 'issue-linha-titulo issue-fechada' : 'issue-linha-titulo'}>
                {issue.titulo}
              </span>
              <span className="issue-linha-dados">
                <span className={fechada ? 'selo selo-pronto' : 'selo selo-pendente'}>
                  {fechada ? '✓' : '○'} {ROTULO_SITUACAO[issue.situacao]}
                </span>
                <span>{issue.estado ?? 'sem estado'}</span>
                <span>{issue.responsavel ?? 'sem responsável'}</span>
              </span>
            </header>

            {envolvidos.length > 0 ? (
              <ul className="repositorios-da-issue">
                {envolvidos.map((repositorio) => (
                  <li key={repositorio.caminho} className="repositorio-identificacao">
                    <a
                      className="repositorio-nome"
                      href={repositorio.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {repositorio.nome}
                    </a>
                    <span className="repositorio-caminho">{repositorio.caminho}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="aviso-sincronizacao">Ainda sem task — nenhum repositório envolvido.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
