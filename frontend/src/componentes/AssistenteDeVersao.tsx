import { useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import {
  useGerarVersao,
  useIssuesDaVersao,
  useRepositoriosDaVersao,
  useTagsDeVarios,
  useVersoesProntas,
} from '../api/hooks';
import type { IssueDaVersao, RepositorioDaVersao, VersaoPronta } from '../api/tipos';
import {
  ESTADO_APOS_RELEASE,
  ESTADO_PRONTO_PARA_TAG,
  ROTULO_TIPO_DE_VERSAO,
  ehRepositorioSemVersionamento,
  grupoDeRepositorios,
  periodoDaVersao,
  proximaVersao,
  tipoDaVersao,
  versaoNaDescricao,
} from '../dominio/versao';
import { SaltoDeVersao } from './SaltoDeVersao';
import { TrilhaDeEtapas } from './TrilhaDeEtapas';

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

function contarIssues(quantidade: number) {
  return `${quantidade} ${quantidade === 1 ? 'issue pronta' : 'issues prontas'}`;
}

export function AssistenteDeVersao() {
  const versoes = useVersoesProntas();
  const [etapa, setEtapa] = useState(0);
  const [versaoEscolhida, setVersaoEscolhida] = useState<VersaoPronta | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);
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

  const escolhidos = disponiveis.filter((item) =>
    selecionados.includes(item.repositorio.caminho),
  );
  const tags = useTagsDeVarios(etapa === 2 ? escolhidos.map((i) => i.repositorio.caminho) : []);

  const porId = new Map(prontas.map((issue) => [issue.id, issue]));

  /** Cada repositório escolhido tem sua própria base e sua própria próxima versão. */
  const planos = escolhidos.map((item) => {
    const naDescricao = versaoNaDescricao(
      versaoEscolhida?.descricao ?? null,
      item.repositorio.nome,
      versaoEscolhida?.titulo ?? '',
    );
    const tagBase =
      naDescricao.acao === 'rc'
        ? naDescricao.tag
        : (tags.porRepositorio[item.repositorio.caminho]?.[0]?.nome ?? null);

    return {
      item,
      naDescricao,
      tagBase,
      nova: naDescricao.acao ? proximaVersao(naDescricao.acao, tagBase) : null,
    };
  });

  const prontoParaGerar = planos.length > 0 && planos.every((plano) => plano.nova !== null);
  const gerada = gerar.data ?? null;
  const carregandoEtapa2 = issues.isLoading || repositorios.isLoading;
  const erro = versoes.error ?? issues.error ?? repositorios.error;
  const tipo = versaoEscolhida ? tipoDaVersao(versaoEscolhida.titulo) : 'release';

  /** Uma issue em dois repositórios da leva aparece uma vez só. */
  const issuesDaLeva = [...new Set(escolhidos.flatMap((item) => item.issues))].sort(
    (a, b) => a - b,
  );

  const recomecar = () => {
    gerar.reset();
    setVersaoEscolhida(null);
    setSelecionados([]);
    setEtapa(0);
  };

  /** Escolher a versão já leva para a etapa do repositório. */
  const escolherVersao = (versao: VersaoPronta) => {
    setVersaoEscolhida(versao);
    setSelecionados([]);
    setEtapa(1);
  };

  /**
   * Repositórios que dividem issue saem juntos, então o clique marca ou
   * desmarca o grupo inteiro — nunca um pedaço dele.
   */
  const alternarGrupo = (caminho: string) => {
    const grupo = grupoDeRepositorios(
      disponiveis.map((item) => ({ caminho: item.repositorio.caminho, issues: item.issues })),
      caminho,
    );

    setSelecionados((atual) =>
      atual.includes(caminho)
        ? atual.filter((escolhido) => !grupo.includes(escolhido))
        : [...atual, ...grupo.filter((membro) => !atual.includes(membro))],
    );
  };

  const listaDeIssues = (ids: number[], estadoFinal?: string) => (
    <ul className="issues">
      {ids.map((id) => {
        const issue = porId.get(id);

        return (
          <li key={id} className="issue">
            <a className="issue-id" href={issue?.url} target="_blank" rel="noreferrer">
              #{id}
            </a>
            <span className="issue-titulo">{issue?.titulo}</span>
            {estadoFinal ? <span className="issue-estado">{estadoFinal}</span> : null}
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className={`assistente assistente-${tipo}`}>
      <header className="assistente-topo">
        <div>
          <p className="assistente-eixo">Liberação de versão</p>
          <h2>
            {versaoEscolhida ? versaoEscolhida.titulo : 'Escolha o que vai ser liberado'}
            {versaoEscolhida ? (
              <span className="selo-tipo-versao">{ROTULO_TIPO_DE_VERSAO[tipo]}</span>
            ) : null}
          </h2>
        </div>
        {gerada ? null : (
          <p className="assistente-apoio">
            Só entram issues em <code>{ESTADO_PRONTO_PARA_TAG}</code>
          </p>
        )}
      </header>

      <TrilhaDeEtapas
        atual={etapa}
        etapas={[
          { rotulo: 'Versão', escolha: versaoEscolhida?.titulo ?? null },
          {
            rotulo: 'Repositórios',
            escolha:
              escolhidos.length === 0
                ? null
                : escolhidos.length === 1
                  ? escolhidos[0].repositorio.nome
                  : `${escolhidos.length} repositórios`,
          },
          {
            rotulo: 'Gerar',
            escolha:
              planos.length === 1
                ? planos[0].nova
                : planos.length > 1
                  ? `${planos.length} versões`
                  : null,
          },
          {
            rotulo: 'Resumo',
            escolha:
              gerada && gerada.versoes.length === 1
                ? gerada.versoes[0].tag
                : gerada
                  ? `${gerada.versoes.length} versões`
                  : null,
          },
        ]}
      />

      {erro ? <p className="erro">{mensagemDoErro(erro)}</p> : null}

      {etapa === 0 ? (
        <>
          {versoes.isLoading ? <p className="carregando">Carregando as versões…</p> : null}
          {!versoes.isLoading && !versoes.isError && (versoes.data ?? []).length === 0 ? (
            <p className="carregando">
              Nenhuma milestone ativa tem issue em <code>{ESTADO_PRONTO_PARA_TAG}</code>. Mova uma
              issue para esse estado no GitLab para liberar uma versão.
            </p>
          ) : null}
          <div className="cartoes">
            {(versoes.data ?? []).map((versao) => {
              const dela = tipoDaVersao(versao.titulo);

              return (
                <button
                  key={versao.id}
                  type="button"
                  className={`cartao-escolha cartao-${dela}`}
                  onClick={() => escolherVersao(versao)}
                >
                  <span className="cartao-eixo">{ROTULO_TIPO_DE_VERSAO[dela]}</span>
                  <strong className="cartao-titulo">{versao.titulo}</strong>
                  <span className="cartao-medida">{contarIssues(versao.issuesNoEstado)}</span>
                  <span className="cartao-apoio">{periodoDaVersao(versao)}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {etapa === 1 ? (
        <>
          {carregandoEtapa2 ? <p className="carregando">Carregando os repositórios…</p> : null}
          {!carregandoEtapa2 && disponiveis.length === 0 ? (
            <p className="carregando">
              Nenhum repositório tem task das issues prontas de {versaoEscolhida?.titulo}.
            </p>
          ) : null}
          <p className="assistente-apoio nota-da-etapa">
            Repositórios que dividem uma issue são liberados juntos: marcar um marca o grupo.
          </p>
          <div className="cartoes">
            {disponiveis.map(({ repositorio, issues: doRepositorio }) => {
              const semVersao = ehRepositorioSemVersionamento(repositorio.caminho);
              const marcado = selecionados.includes(repositorio.caminho);

              return (
                <div
                  key={repositorio.caminho}
                  className={[
                    'cartao-escolha',
                    `cartao-${tipo}`,
                    'cartao-com-lista',
                    marcado ? 'cartao-marcado' : '',
                    semVersao ? 'cartao-inerte' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {semVersao ? (
                    <div className="cartao-alvo">
                      <span className="cartao-eixo">versiona por aplicação</span>
                      <strong className="cartao-titulo">{repositorio.nome}</strong>
                      <span className="cartao-apoio">{repositorio.caminho}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="cartao-alvo"
                      aria-pressed={marcado}
                      onClick={() => alternarGrupo(repositorio.caminho)}
                    >
                      <span className="cartao-eixo">
                        {marcado ? '✓ na leva' : contarIssues(doRepositorio.length)}
                      </span>
                      <strong className="cartao-titulo">{repositorio.nome}</strong>
                      <span className="cartao-apoio">{repositorio.caminho}</span>
                    </button>
                  )}
                  {listaDeIssues(doRepositorio)}
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {etapa === 2 ? (
        <div className="painel">
          {tags.carregando ? <p className="carregando">Calculando as próximas versões…</p> : null}

          {planos.map(({ item, naDescricao, tagBase, nova }) => (
            <div key={item.repositorio.caminho} className="plano">
              <header className="plano-topo">
                <strong>{item.repositorio.nome}</strong>
                <span className="cartao-apoio">{item.repositorio.caminho}</span>
              </header>

              {nova && naDescricao.acao ? (
                <SaltoDeVersao base={tagBase} nova={nova} acao={naDescricao.acao} />
              ) : null}

              {naDescricao.malformada ? (
                <p className="aviso">
                  A descrição de {versaoEscolhida?.titulo} cita {item.repositorio.nome}, mas sem
                  nenhuma versão legível na linha. Corrija a linha no GitLab para seguir.
                </p>
              ) : null}
              {!nova && !tags.carregando && !naDescricao.malformada ? (
                <p className="aviso">
                  {item.repositorio.nome} não tem tag anterior no padrão de versão, então o número
                  não pode ser calculado.
                </p>
              ) : null}

              {listaDeIssues(item.issues)}
            </div>
          ))}

          {prontoParaGerar ? (
            <>
              <h3 className="titulo-secao">O que vai acontecer</h3>
              <ol className="efeitos">
                <li>
                  {planos.length === 1
                    ? `${planos[0].nova} vira uma tag em ${planos[0].item.repositorio.nome}`
                    : `${planos.length} tags são criadas, uma por repositório`}
                  , a partir da branch <code>{versaoEscolhida?.titulo}</code>
                </li>
                <li>
                  {planos.length === 1
                    ? 'Um lançamento de mesmo nome é publicado'
                    : `${planos.length} lançamentos são publicados, cada um com as issues do seu repositório`}
                </li>
                <li>
                  A descrição de <code>{versaoEscolhida?.titulo}</code> passa a apontar{' '}
                  {planos.length === 1 ? 'essa versão' : 'todas essas versões'}
                </li>
                <li>
                  {issuesDaLeva.length === 1
                    ? 'A issue vai'
                    : `As ${issuesDaLeva.length} issues vão`}{' '}
                  de <code>{ESTADO_PRONTO_PARA_TAG}</code> para <code>{ESTADO_APOS_RELEASE}</code>
                </li>
              </ol>
            </>
          ) : null}

          {gerar.isError ? <p className="erro">{mensagemDoErro(gerar.error)}</p> : null}
        </div>
      ) : null}

      {etapa === ETAPA_RESUMO && gerada ? (
        <div className="painel">
          <div className="conquista">
            <span className="conquista-marca" aria-hidden>
              ✓
            </span>
            <div>
              <strong className="conquista-numero">
                {gerada.versoes.length === 1
                  ? gerada.versoes[0].tag
                  : `${gerada.versoes.length} versões`}
              </strong>
              <p>
                {gerada.versoes.length === 1 ? 'está no ar' : 'estão no ar'}, {gerada.milestone} já
                aponta {gerada.versoes.length === 1 ? 'para ela' : 'para todas'} e as issues foram
                para <code>{gerada.estadoDasIssues}</code>.
              </p>
            </div>
          </div>

          <div className="destinos">
            {gerada.versoes.map((versao) => (
              <a
                key={versao.repositorio}
                className="destino"
                href={versao.urlRelease}
                target="_blank"
                rel="noreferrer"
              >
                <span className="destino-eixo">{versao.nome}</span>
                <strong>{versao.tag}</strong>
              </a>
            ))}
            <a className="destino" href={gerada.urlMilestone} target="_blank" rel="noreferrer">
              <span className="destino-eixo">Milestone</span>
              <strong>{gerada.milestone}</strong>
            </a>
          </div>

          <h3 className="titulo-secao">
            {gerada.issues.length === 1
              ? 'Issue publicada'
              : `${gerada.issues.length} issues publicadas`}
          </h3>
          {listaDeIssues(gerada.issues, gerada.estadoDasIssues)}

          <h3 className="titulo-secao">Descrição da milestone agora</h3>
          <pre className="bloco-texto">{gerada.descricao}</pre>
        </div>
      ) : null}

      <footer className="assistente-acoes">
        {etapa === ETAPA_RESUMO ? (
          <button type="button" className="aba primario" onClick={recomecar}>
            Liberar outra versão
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
            {etapa === 1 ? (
              <button
                type="button"
                className="aba gerar"
                disabled={escolhidos.length === 0}
                onClick={() => setEtapa(2)}
              >
                Avançar com{' '}
                {escolhidos.length === 1
                  ? '1 repositório'
                  : `${escolhidos.length} repositórios`}
              </button>
            ) : null}
            {etapa === 2 ? (
              <button
                type="button"
                className="aba gerar"
                disabled={!prontoParaGerar || gerar.isPending}
                onClick={() => setConfirmando(true)}
              >
                {gerar.isPending
                  ? 'Gerando…'
                  : planos.length === 1
                    ? `Gerar ${planos[0].nova}`
                    : `Gerar ${planos.length} versões`}
              </button>
            ) : null}
          </>
        )}
      </footer>

      {confirmando && prontoParaGerar && versaoEscolhida ? (
        <div className="modal-fundo" onClick={() => setConfirmando(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar a liberação da versão"
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="modal-cabecalho">
              <h2>
                {planos.length === 1
                  ? `Gerar ${planos[0].nova}?`
                  : `Gerar ${planos.length} versões?`}
              </h2>
            </header>
            <ul className="issues">
              {planos.map(({ item, nova }) => (
                <li key={item.repositorio.caminho} className="issue">
                  <span className="issue-titulo">{item.repositorio.nome}</span>
                  <strong>{nova}</strong>
                </li>
              ))}
            </ul>
            <p>
              Cada um ganha tag e lançamento a partir da branch{' '}
              <code>{versaoEscolhida.titulo}</code>, a descrição da milestone é atualizada e as{' '}
              {issuesDaLeva.length === 1 ? 'issue vai' : `${issuesDaLeva.length} issues vão`} para{' '}
              <code>{ESTADO_APOS_RELEASE}</code>. Tudo acontece no GitLab agora.
            </p>
            <div className="assistente-acoes">
              <button type="button" className="aba" onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="aba gerar"
                onClick={() => {
                  setConfirmando(false);
                  gerar.mutate(
                    {
                      milestone: versaoEscolhida.titulo,
                      repositorios: planos.map(({ item, nova }) => ({
                        repositorio: item.repositorio.caminho,
                        tag: nova as string,
                        issues: item.issues,
                      })),
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
