import { useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import {
  useIssuesDaVersao,
  useRepositoriosDaVersao,
  useTagsDoRepositorio,
  useVersoesProntas,
} from '../api/hooks';
import type { IssueDaVersao, RepositorioDaVersao, VersaoPronta } from '../api/tipos';
import {
  ESTADO_PRONTO_PARA_TAG,
  ROTULO_ACAO,
  periodoDaVersao,
  proximaVersao,
  versaoNaDescricao,
} from '../dominio/versao';

const ETAPAS = ['Versão', 'Repositório', 'Gerar'];

function issuesProntas(issues: IssueDaVersao[]) {
  return issues.filter((issue) => issue.estado === ESTADO_PRONTO_PARA_TAG);
}

/** Só entram repositórios com task de alguma issue pronta para release. */
function repositoriosComIssuesProntas(
  repositorios: RepositorioDaVersao[],
  prontas: IssueDaVersao[],
) {
  const ids = new Set(prontas.map((issue) => issue.id));

  return repositorios
    .map((repositorio) => ({
      repositorio,
      issues: repositorio.issues.filter((id) => ids.has(id)),
    }))
    .filter((item) => item.issues.length > 0);
}

export function AssistenteDeVersao() {
  const versoes = useVersoesProntas();
  const [etapa, setEtapa] = useState(0);
  const [versaoEscolhida, setVersaoEscolhida] = useState<VersaoPronta | null>(null);
  const [repositorioEscolhido, setRepositorioEscolhido] = useState<string | null>(null);

  const milestone = versaoEscolhida?.titulo ?? null;
  const issues = useIssuesDaVersao(etapa >= 1 ? milestone : null);
  const repositorios = useRepositoriosDaVersao(etapa >= 1 ? milestone : null);

  const prontas = useMemo(() => issuesProntas(issues.data ?? []), [issues.data]);
  const disponiveis = useMemo(
    () => repositoriosComIssuesProntas(repositorios.data?.repositorios ?? [], prontas),
    [repositorios.data, prontas],
  );
  const escolhido = disponiveis.find(
    (item) => item.repositorio.caminho === repositorioEscolhido,
  );

  const tags = useTagsDoRepositorio(
    etapa === 2 ? (escolhido?.repositorio.caminho ?? null) : null,
  );

  /** Escolher o repositório já leva todas as issues prontas dele. */
  const marcadas = escolhido?.issues ?? [];

  const naDescricao = versaoNaDescricao(
    versaoEscolhida?.descricao ?? null,
    escolhido?.repositorio.nome ?? '',
    versaoEscolhida?.titulo ?? '',
  );
  /** Nova RC parte da tag citada na descrição; patch e minor, da maior tag do repositório. */
  const tagBase = naDescricao.acao === 'rc' ? naDescricao.tag : (tags.data?.[0]?.nome ?? null);
  const nova = naDescricao.acao ? proximaVersao(naDescricao.acao, tagBase) : null;
  const porId = new Map(prontas.map((issue) => [issue.id, issue]));
  const carregandoEtapa2 = issues.isLoading || repositorios.isLoading;
  const erro = versoes.error ?? issues.error ?? repositorios.error;

  const podeAvancar =
    (etapa === 0 && versaoEscolhida !== null) || (etapa === 1 && escolhido !== undefined);

  /** Escolher a versão já leva para a etapa do repositório. */
  const escolherVersao = (versao: VersaoPronta) => {
    setVersaoEscolhida(versao);
    setRepositorioEscolhido(null);
    setEtapa(1);
  };

  return (
    <section className="cartao cartao-largo assistente">
      <header>
        <h2>Liberar nova versão</h2>
        <p className="subtitulo">
          Etapa {etapa + 1} de {ETAPAS.length} · {ETAPAS[etapa]}
        </p>
      </header>

      {erro ? <p className="erro">{mensagemDoErro(erro)}</p> : null}

      {etapa === 0 ? (
        <>
          {versoes.isLoading ? <p className="carregando">Carregando as versões…</p> : null}
          {!versoes.isLoading && !versoes.isError && (versoes.data ?? []).length === 0 ? (
            <p className="carregando">
              Nenhuma versão ativa com issue em <code>{ESTADO_PRONTO_PARA_TAG}</code>.
            </p>
          ) : null}
          <div className="escolha-versoes">
            {(versoes.data ?? []).map((versao) => (
              <button
                key={versao.id}
                type="button"
                className={
                  versaoEscolhida?.id === versao.id ? 'escolha escolha-marcada' : 'escolha'
                }
                aria-pressed={versaoEscolhida?.id === versao.id}
                onClick={() => escolherVersao(versao)}
              >
                <strong>{versao.titulo}</strong>
                <span>
                  {versao.issuesNoEstado}{' '}
                  {versao.issuesNoEstado === 1 ? 'issue pronta' : 'issues prontas'}
                </span>
                <span className="escolha-apoio">{periodoDaVersao(versao)}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {etapa === 1 ? (
        <>
          {carregandoEtapa2 ? <p className="carregando">Carregando os repositórios…</p> : null}
          {!carregandoEtapa2 && disponiveis.length === 0 ? (
            <p className="carregando">
              Nenhum repositório com task das issues prontas de {versaoEscolhida?.titulo}.
            </p>
          ) : null}
          <div className="escolha-versoes">
            {disponiveis.map(({ repositorio, issues: doRepositorio }) => {
              const selecionado = repositorioEscolhido === repositorio.caminho;

              return (
                <div
                  key={repositorio.caminho}
                  className={selecionado ? 'escolha escolha-marcada' : 'escolha'}
                >
                  <button
                    type="button"
                    className="escolha-alvo"
                    aria-pressed={selecionado}
                    onClick={() => setRepositorioEscolhido(repositorio.caminho)}
                  >
                    <strong>{repositorio.nome}</strong>
                    <span>
                      {doRepositorio.length}{' '}
                      {doRepositorio.length === 1 ? 'issue pronta' : 'issues prontas'}
                    </span>
                    <span className="escolha-apoio">{repositorio.caminho}</span>
                  </button>

                  <ul className="escolha-issues">
                    {doRepositorio.map((id) => {
                      const issue = porId.get(id);

                      return (
                        <li key={id}>
                          <a
                            className="issue-numero"
                            href={issue?.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            #{id}
                          </a>
                          <span className="issue-linha-titulo">{issue?.titulo}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {etapa === 2 ? (
        <div className="resumo-versao">
          <dl className="issue-dados">
            <div>
              <dt>Milestone</dt>
              <dd>{versaoEscolhida?.titulo}</dd>
            </div>
            <div>
              <dt>Repositório</dt>
              <dd>{escolhido?.repositorio.nome}</dd>
            </div>
            <div>
              <dt>Issues</dt>
              <dd>{marcadas.map((id) => `#${id}`).join(', ')}</dd>
            </div>
            <div>
              <dt>{naDescricao.acao ? ROTULO_ACAO[naDescricao.acao] : 'Nova versão'}</dt>
              <dd>
                {tags.isLoading ? (
                  'calculando…'
                ) : nova ? (
                  <strong className="numero-da-versao">{nova}</strong>
                ) : (
                  'não foi possível calcular'
                )}
              </dd>
            </div>
          </dl>

          <p className="aviso-sincronizacao">
            {naDescricao.acao === 'rc'
              ? `A descrição de ${versaoEscolhida?.titulo} aponta ${naDescricao.tag} para este repositório.`
              : `${escolhido?.repositorio.nome} não aparece na descrição de ${versaoEscolhida?.titulo}; a base é a maior tag do repositório${tagBase ? ` (${tagBase})` : ''}.`}
          </p>

          {naDescricao.malformada ? (
            <p className="aviso">
              A descrição de {versaoEscolhida?.titulo} cita {escolhido?.repositorio.nome}, mas sem
              nenhuma versão legível na linha.
            </p>
          ) : null}
          {!nova && !tags.isLoading && !naDescricao.malformada ? (
            <p className="aviso">
              O repositório não tem tag anterior no padrão de versão, então o número não pode ser
              calculado.
            </p>
          ) : null}

          <p className="aviso">A geração da versão ainda será implementada.</p>
        </div>
      ) : null}

      <footer className="assistente-acoes">
        <button
          type="button"
          className="aba"
          disabled={etapa === 0}
          onClick={() => setEtapa((atual) => atual - 1)}
        >
          Voltar
        </button>
        <button
          type="button"
          className="aba primario"
          disabled={!podeAvancar || etapa === ETAPAS.length - 1}
          onClick={() => setEtapa((atual) => atual + 1)}
        >
          Avançar
        </button>
      </footer>
    </section>
  );
}
