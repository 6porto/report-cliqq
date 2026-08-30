import { useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import {
  useGerarVersao,
  useIssuesDaVersao,
  useRepositoriosDaVersao,
  useTagsDoRepositorio,
  useVersoesProntas,
} from '../api/hooks';
import type { IssueDaVersao, RepositorioDaVersao, VersaoPronta } from '../api/tipos';
import {
  ESTADO_PRONTO_PARA_TAG,
  dividirVersao,
  periodoDaVersao,
  proximaVersao,
  versaoNaDescricao,
} from '../dominio/versao';

const ETAPAS = ['Versão', 'Repositório', 'Gerar', 'Resumo'];
const ETAPA_RESUMO = 3;

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
  const [confirmando, setConfirmando] = useState(false);
  const gerar = useGerarVersao();

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
  const porId = new Map(prontas.map((issue) => [issue.id, issue]));

  const naDescricao = versaoNaDescricao(
    versaoEscolhida?.descricao ?? null,
    escolhido?.repositorio.nome ?? '',
    versaoEscolhida?.titulo ?? '',
  );
  /** Nova RC parte da tag citada na descrição; patch e minor, da maior tag do repositório. */
  const tagBase = naDescricao.acao === 'rc' ? naDescricao.tag : (tags.data?.[0]?.nome ?? null);
  const nova = naDescricao.acao ? proximaVersao(naDescricao.acao, tagBase) : null;
  /** Em uma nova RC só o `rcN` é destacado: o resto do número não mudou. */
  const partesDaNova =
    naDescricao.acao && nova ? dividirVersao(naDescricao.acao, nova) : null;

  /** A mensagem da tag abre com a milestone que a originou e lista as issues. */
  const mensagemDaTag = [
    versaoEscolhida
      ? `Milestone: [${versaoEscolhida.titulo}](${versaoEscolhida.url})`
      : 'Milestone: —',
    '',
    ...marcadas.map((id) => {
      const issue = porId.get(id);

      return issue ? `- [#${issue.id}](${issue.url}) ${issue.titulo}` : `- #${id}`;
    }),
  ].join('\n');
  const gerada = gerar.data ?? null;
  const carregandoEtapa2 = issues.isLoading || repositorios.isLoading;
  const erro = versoes.error ?? issues.error ?? repositorios.error;

  const podeAvancar =
    (etapa === 0 && versaoEscolhida !== null) || (etapa === 1 && escolhido !== undefined);

  const recomecar = () => {
    gerar.reset();
    setVersaoEscolhida(null);
    setRepositorioEscolhido(null);
    setEtapa(0);
  };

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
              <dt>Nova versão</dt>
              <dd>
                {tags.isLoading ? (
                  'calculando…'
                ) : nova ? (
                  <strong className="numero-da-versao">
                    {partesDaNova?.base}
                    <span className="numero-destacado">
                      {partesDaNova ? partesDaNova.destaque : nova}
                    </span>
                  </strong>
                ) : (
                  'não foi possível calcular'
                )}
              </dd>
            </div>
          </dl>

          <h3 className="titulo-secao">
            Issues da versão · {marcadas.length}{' '}
            {marcadas.length === 1 ? 'issue' : 'issues'}
          </h3>
          <ul className="escolha-issues issues-da-versao">
            {marcadas.map((id) => {
              const issue = porId.get(id);

              return (
                <li key={id}>
                  <a className="issue-numero" href={issue?.url} target="_blank" rel="noreferrer">
                    #{id}
                  </a>
                  <span className="issue-linha-titulo">{issue?.titulo}</span>
                  <span className="issue-linha-dados">
                    <span>{issue?.responsavel ?? 'sem responsável'}</span>
                  </span>
                </li>
              );
            })}
          </ul>

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

          {gerar.isError ? <p className="erro">{mensagemDoErro(gerar.error)}</p> : null}
        </div>
      ) : null}

      {etapa === ETAPA_RESUMO && gerada ? (
        <div className="resumo-versao">
          <p className="aviso-salvo">
            Tag <strong>{gerada.tag}</strong> criada em {escolhido?.repositorio.nome} e descrição
            da milestone {gerada.milestone} atualizada.
          </p>

          <dl className="issue-dados">
            <div>
              <dt>Tag</dt>
              <dd>
                <a href={gerada.urlTag} target="_blank" rel="noreferrer">
                  {gerada.tag}
                </a>
              </dd>
            </div>
            <div>
              <dt>Milestone</dt>
              <dd>
                <a href={gerada.urlMilestone} target="_blank" rel="noreferrer">
                  {gerada.milestone}
                </a>
              </dd>
            </div>
            <div>
              <dt>Repositório</dt>
              <dd>
                <a href={escolhido?.repositorio.url} target="_blank" rel="noreferrer">
                  {escolhido?.repositorio.nome}
                </a>
              </dd>
            </div>
          </dl>

          <h3 className="titulo-secao">
            Issues na versão · {marcadas.length} {marcadas.length === 1 ? 'issue' : 'issues'}
          </h3>
          <ul className="escolha-issues issues-da-versao">
            {marcadas.map((id) => {
              const issue = porId.get(id);

              return (
                <li key={id}>
                  <a className="issue-numero" href={issue?.url} target="_blank" rel="noreferrer">
                    #{id}
                  </a>
                  <span className="issue-linha-titulo">{issue?.titulo}</span>
                </li>
              );
            })}
          </ul>

          <h3 className="titulo-secao">Descrição da milestone agora</h3>
          <pre className="descricao-tag">{gerada.descricao}</pre>
        </div>
      ) : null}

      <footer className="assistente-acoes">
        {etapa === ETAPA_RESUMO ? (
          <button type="button" className="aba primario" onClick={recomecar}>
            Gerar outra versão
          </button>
        ) : (
          <>
            <button
              type="button"
              className="aba"
              disabled={etapa === 0 || gerar.isPending}
              onClick={() => setEtapa((atual) => atual - 1)}
            >
              Voltar
            </button>
            {etapa === ETAPA_RESUMO - 1 ? (
              <button
                type="button"
                className="aba primario"
                disabled={!nova || gerar.isPending}
                onClick={() => setConfirmando(true)}
              >
                {gerar.isPending ? 'Gerando…' : 'Gerar versão'}
              </button>
            ) : (
              <button
                type="button"
                className="aba primario"
                disabled={!podeAvancar}
                onClick={() => setEtapa((atual) => atual + 1)}
              >
                Avançar
              </button>
            )}
          </>
        )}
      </footer>

      {confirmando && nova && escolhido && versaoEscolhida ? (
        <div className="modal-fundo" onClick={() => setConfirmando(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar a geração da versão"
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="modal-cabecalho">
              <h2>Gerar {nova}?</h2>
            </header>
            <p>
              A tag <strong>{nova}</strong> será criada em{' '}
              <strong>{escolhido.repositorio.nome}</strong> a partir da branch{' '}
              <code>{versaoEscolhida.titulo}</code>, e a descrição da milestone{' '}
              <strong>{versaoEscolhida.titulo}</strong> será atualizada com essa versão.
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
                  gerar.mutate(
                    {
                      milestone: versaoEscolhida.titulo,
                      repositorio: escolhido.repositorio.caminho,
                      tag: nova,
                      mensagem: mensagemDaTag,
                    },
                    { onSuccess: () => setEtapa(ETAPA_RESUMO) },
                  );
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
