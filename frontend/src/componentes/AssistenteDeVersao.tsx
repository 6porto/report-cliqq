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
  ESTADO_APOS_RELEASE,
  ESTADO_PRONTO_PARA_TAG,
  ROTULO_TIPO_DE_VERSAO,
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
  const escolhido = disponiveis.find((item) => item.repositorio.caminho === repositorioEscolhido);

  const tags = useTagsDoRepositorio(etapa === 2 ? (escolhido?.repositorio.caminho ?? null) : null);

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

  const gerada = gerar.data ?? null;
  const carregandoEtapa2 = issues.isLoading || repositorios.isLoading;
  const erro = versoes.error ?? issues.error ?? repositorios.error;
  const tipo = versaoEscolhida ? tipoDaVersao(versaoEscolhida.titulo) : 'release';

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

  /** E escolher o repositório já leva para a etapa de gerar. */
  const escolherRepositorio = (caminho: string) => {
    setRepositorioEscolhido(caminho);
    setEtapa(2);
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
          { rotulo: 'Repositório', escolha: escolhido?.repositorio.nome ?? null },
          { rotulo: 'Gerar', escolha: nova },
          { rotulo: 'Resumo', escolha: gerada?.tag ?? null },
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
          <div className="cartoes">
            {disponiveis.map(({ repositorio, issues: doRepositorio }) => (
              <div
                key={repositorio.caminho}
                className={`cartao-escolha cartao-${tipo} cartao-com-lista`}
              >
                <button
                  type="button"
                  className="cartao-alvo"
                  onClick={() => escolherRepositorio(repositorio.caminho)}
                >
                  <span className="cartao-eixo">{contarIssues(doRepositorio.length)}</span>
                  <strong className="cartao-titulo">{repositorio.nome}</strong>
                  <span className="cartao-apoio">{repositorio.caminho}</span>
                </button>
                {listaDeIssues(doRepositorio)}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {etapa === 2 ? (
        <div className="painel">
          {tags.isLoading ? <p className="carregando">Calculando a próxima versão…</p> : null}

          {!tags.isLoading && nova && naDescricao.acao ? (
            <SaltoDeVersao base={tagBase} nova={nova} acao={naDescricao.acao} />
          ) : null}

          {naDescricao.malformada ? (
            <p className="aviso">
              A descrição de {versaoEscolhida?.titulo} cita {escolhido?.repositorio.nome}, mas sem
              nenhuma versão legível na linha. Corrija a linha no GitLab para seguir.
            </p>
          ) : null}
          {!nova && !tags.isLoading && !naDescricao.malformada ? (
            <p className="aviso">
              {escolhido?.repositorio.nome} não tem tag anterior no padrão de versão, então o
              número não pode ser calculado.
            </p>
          ) : null}

          {nova ? (
            <>
              <h3 className="titulo-secao">O que vai acontecer</h3>
              <ol className="efeitos">
                <li>
                  <strong>{nova}</strong> vira uma tag em {escolhido?.repositorio.nome}, a partir
                  da branch <code>{versaoEscolhida?.titulo}</code>
                </li>
                <li>
                  Um lançamento de mesmo nome é publicado, com as{' '}
                  {marcadas.length === 1 ? 'issue abaixo' : `${marcadas.length} issues abaixo`}
                </li>
                <li>
                  A descrição de <code>{versaoEscolhida?.titulo}</code> passa a apontar essa versão
                </li>
                <li>
                  {marcadas.length === 1 ? 'A issue vai' : `As ${marcadas.length} issues vão`} de{' '}
                  <code>{ESTADO_PRONTO_PARA_TAG}</code> para <code>{ESTADO_APOS_RELEASE}</code>
                </li>
              </ol>

              <p className="assistente-apoio">
                {naDescricao.acao === 'rc'
                  ? `A base saiu da descrição de ${versaoEscolhida?.titulo}, que aponta ${naDescricao.tag} para este repositório.`
                  : `${escolhido?.repositorio.nome} não aparece na descrição de ${versaoEscolhida?.titulo}, então a base é a maior tag do repositório.`}
              </p>
            </>
          ) : null}

          <h3 className="titulo-secao">
            {marcadas.length === 1 ? 'Issue incluída' : `${marcadas.length} issues incluídas`}
          </h3>
          {listaDeIssues(marcadas)}

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
              <strong className="conquista-numero">{gerada.tag}</strong>
              <p>
                está no ar em {escolhido?.repositorio.nome}, {gerada.milestone} já aponta para ela
                e as issues foram para <code>{gerada.estadoDasIssues}</code>.
              </p>
            </div>
          </div>

          <div className="destinos">
            <a className="destino" href={gerada.urlTag} target="_blank" rel="noreferrer">
              <span className="destino-eixo">Tag</span>
              <strong>{gerada.tag}</strong>
            </a>
            <a className="destino" href={gerada.urlRelease} target="_blank" rel="noreferrer">
              <span className="destino-eixo">Lançamento</span>
              <strong>{gerada.tag}</strong>
            </a>
            <a className="destino" href={gerada.urlMilestone} target="_blank" rel="noreferrer">
              <span className="destino-eixo">Milestone</span>
              <strong>{gerada.milestone}</strong>
            </a>
            <a
              className="destino"
              href={escolhido?.repositorio.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="destino-eixo">Repositório</span>
              <strong>{escolhido?.repositorio.nome}</strong>
            </a>
          </div>

          <h3 className="titulo-secao">
            {marcadas.length === 1 ? 'Issue publicada' : `${marcadas.length} issues publicadas`}
          </h3>
          {listaDeIssues(marcadas, gerada.estadoDasIssues)}

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
            {etapa === 2 ? (
              <button
                type="button"
                className="aba gerar"
                disabled={!nova || gerar.isPending}
                onClick={() => setConfirmando(true)}
              >
                {gerar.isPending ? 'Gerando…' : `Gerar ${nova ?? 'versão'}`}
              </button>
            ) : null}
          </>
        )}
      </footer>

      {confirmando && nova && escolhido && versaoEscolhida ? (
        <div className="modal-fundo" onClick={() => setConfirmando(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar a liberação da versão"
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="modal-cabecalho">
              <h2>Gerar {nova}?</h2>
            </header>
            <p>
              Isso cria a tag e o lançamento em <strong>{escolhido.repositorio.nome}</strong>, a
              partir da branch <code>{versaoEscolhida.titulo}</code>, e atualiza a descrição da
              milestone. As três ações acontecem no GitLab agora.
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
                      repositorio: escolhido.repositorio.caminho,
                      tag: nova,
                      issues: marcadas,
                    },
                    { onSuccess: () => setEtapa(ETAPA_RESUMO) },
                  );
                }}
              >
                Gerar {nova}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
