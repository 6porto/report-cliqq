import { useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useIssuesDaVersao, useRepositoriosDaVersao, useVersoes } from '../api/hooks';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { IssuesPorRepositorio } from '../componentes/IssuesPorRepositorio';
import { ListaIssuesDaVersao } from '../componentes/ListaIssuesDaVersao';
import { ListaRepositoriosDaVersao } from '../componentes/ListaRepositoriosDaVersao';
import { RepositoriosPorIssue } from '../componentes/RepositoriosPorIssue';
import {
  COLUNAS_ORDENAVEIS,
  FILTROS_INICIAIS,
  ORDENACAO_PADRAO,
  PREFIXOS_DE_VERSAO,
  ROTULO_ESTADO_VERSAO,
  ROTULO_ORDENACAO,
  ehVersaoAtiva,
  filtrarIssues,
  periodoDaVersao,
  sistemasDistintos,
  tiposDistintos,
  type ColunaIssue,
  type FiltroSituacao,
  type OrdenacaoIssues,
} from '../dominio/versao';

export function Versao() {
  const versoes = useVersoes();
  const [incluirFechadas, setIncluirFechadas] = useState(false);
  const [versaoSelecionada, setVersaoSelecionada] = useState<string | null>(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoIssues>(ORDENACAO_PADRAO);

  const issues = useIssuesDaVersao(versaoSelecionada);
  const repositorios = useRepositoriosDaVersao(versaoSelecionada);

  const todasAsVersoes = versoes.data ?? [];
  const listadas = incluirFechadas ? todasAsVersoes : todasAsVersoes.filter(ehVersaoAtiva);
  const selecionada = todasAsVersoes.find((versao) => versao.titulo === versaoSelecionada) ?? null;

  const carregadas = useMemo(() => issues.data ?? [], [issues.data]);
  const envolvidos = useMemo(
    () => repositorios.data?.repositorios ?? [],
    [repositorios.data],
  );
  const issuesSemTask = repositorios.data?.issuesSemTask ?? [];
  const filtradas = useMemo(() => filtrarIssues(carregadas, filtros), [carregadas, filtros]);
  const sistemas = useMemo(() => sistemasDistintos(carregadas), [carregadas]);
  const tipos = useMemo(() => tiposDistintos(carregadas), [carregadas]);

  const trocarVersao = (valor: string) => {
    setVersaoSelecionada(valor || null);
    setFiltros(FILTROS_INICIAIS);
    setOrdenacao(ORDENACAO_PADRAO);
  };

  const inverterDirecao = () =>
    setOrdenacao((atual) => ({
      ...atual,
      direcao: atual.direcao === 'asc' ? 'desc' : 'asc',
    }));

  return (
    <>
      <div className="barra-sincronizacao">
        <div className="filtros">
          <select
            value={versaoSelecionada ?? ''}
            aria-label="Selecionar versão"
            disabled={versoes.isLoading}
            onChange={(evento) => trocarVersao(evento.target.value)}
          >
            <option value="">Selecione uma versão</option>
            {listadas.map((versao) => (
              <option key={versao.id} value={versao.titulo}>
                {versao.titulo}
                {versao.estado === 'closed' ? ' (fechada)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="aba"
            aria-pressed={incluirFechadas}
            onClick={() => setIncluirFechadas((ligado) => !ligado)}
          >
            {incluirFechadas ? 'Ativas e fechadas' : 'Só ativas'}
          </button>
        </div>
        <p className="subtitulo">
          Milestones de <code>mercantil/mercantil</code> que começam com{' '}
          <code>{PREFIXOS_DE_VERSAO[0]}</code> ou <code>{PREFIXOS_DE_VERSAO[1]}</code>
        </p>
      </div>

      {versoes.isError ? <p className="erro">{mensagemDoErro(versoes.error)}</p> : null}
      {issues.isError ? <p className="erro">{mensagemDoErro(issues.error)}</p> : null}

      {versoes.isLoading ? <p className="carregando">Carregando as versões…</p> : null}
      {!versoes.isLoading && !versoes.isError && listadas.length === 0 ? (
        <p className="carregando">
          Nenhuma milestone com esses prefixos
          {incluirFechadas ? '' : ' entre as ativas'}.
        </p>
      ) : null}

      {selecionada ? (
        <CartaoGrafico
          largo
          titulo={selecionada.titulo}
          subtitulo={`${ROTULO_ESTADO_VERSAO[selecionada.estado] ?? selecionada.estado} · ${periodoDaVersao(selecionada)}`}
          acoes={
            <a className="aba" href={selecionada.url} target="_blank" rel="noreferrer">
              Abrir no GitLab
            </a>
          }
        >
          {selecionada.descricao ? (
            <p className="descricao-texto">{selecionada.descricao}</p>
          ) : (
            <p className="carregando">Milestone sem descrição.</p>
          )}

          <div className="filtros">
            <select
              value={filtros.situacao}
              aria-label="Filtrar por situação"
              onChange={(evento) =>
                setFiltros((atual) => ({
                  ...atual,
                  situacao: evento.target.value as FiltroSituacao,
                }))
              }
            >
              <option value="todas">Todas as situações</option>
              <option value="aberta">Só abertas</option>
              <option value="fechada">Só fechadas</option>
            </select>
            <select
              value={filtros.sistema}
              aria-label="Filtrar por sistema"
              onChange={(evento) =>
                setFiltros((atual) => ({ ...atual, sistema: evento.target.value }))
              }
            >
              <option value="">Todos os sistemas</option>
              {sistemas.map((sistema) => (
                <option key={sistema} value={sistema}>
                  {sistema}
                </option>
              ))}
            </select>
            <select
              value={filtros.tipo}
              aria-label="Filtrar por tipo"
              onChange={(evento) =>
                setFiltros((atual) => ({ ...atual, tipo: evento.target.value }))
              }
            >
              <option value="">Todos os tipos</option>
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={filtros.busca}
              placeholder="Buscar por número ou título"
              aria-label="Buscar issue"
              onChange={(evento) =>
                setFiltros((atual) => ({ ...atual, busca: evento.target.value }))
              }
            />
            <select
              value={ordenacao.coluna}
              aria-label="Ordenar por"
              onChange={(evento) =>
                setOrdenacao((atual) => ({
                  ...atual,
                  coluna: evento.target.value as ColunaIssue,
                }))
              }
            >
              {COLUNAS_ORDENAVEIS.map((coluna) => (
                <option key={coluna} value={coluna}>
                  Ordenar por {ROTULO_ORDENACAO[coluna].toLowerCase()}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="aba"
              onClick={inverterDirecao}
              title="Inverter a ordem"
            >
              {ordenacao.direcao === 'asc' ? '▲ crescente' : '▼ decrescente'}
            </button>
            <span className="aviso-sincronizacao">
              {filtradas.length} de {carregadas.length} issues
            </span>
          </div>

          {issues.isLoading ? <p className="carregando">Carregando as issues…</p> : null}
          {!issues.isLoading && carregadas.length === 0 ? (
            <p className="carregando">Nenhuma issue vinculada a esta versão.</p>
          ) : null}
          {carregadas.length > 0 && filtradas.length === 0 ? (
            <p className="carregando">Nenhuma issue com esses filtros.</p>
          ) : null}
          {filtradas.length > 0 ? (
            <ListaIssuesDaVersao issues={filtradas} ordenacao={ordenacao} />
          ) : null}
        </CartaoGrafico>
      ) : null}

      {selecionada ? (
        <div className="secao-repositorios">
          <CartaoGrafico
            largo
            titulo="Repositórios envolvidos"
            subtitulo="Projetos onde as tasks das issues desta versão foram abertas. Considera todas as issues da versão, sem os filtros acima."
          >
            {repositorios.isError ? (
              <p className="erro">{mensagemDoErro(repositorios.error)}</p>
            ) : null}
            {repositorios.isLoading ? (
              <p className="carregando">Carregando os repositórios…</p>
            ) : null}
            {!repositorios.isLoading && !repositorios.isError && envolvidos.length === 0 ? (
              <p className="carregando">Nenhuma task encontrada nas issues desta versão.</p>
            ) : null}
            {envolvidos.length > 0 ? (
              <ListaRepositoriosDaVersao repositorios={envolvidos} />
            ) : null}
            {issuesSemTask.length > 0 ? (
              <p className="aviso-sincronizacao">
                {issuesSemTask.length}{' '}
                {issuesSemTask.length === 1 ? 'issue ainda sem task' : 'issues ainda sem task'}:{' '}
                {issuesSemTask.map((id) => `#${id}`).join(', ')}
              </p>
            ) : null}
          </CartaoGrafico>
        </div>
      ) : null}

      {selecionada ? (
        <div className="secao-repositorios">
          <CartaoGrafico
            largo
            titulo="Versões"
            subtitulo="Cada repositório com as issues da versão que têm task nele. Uma issue aparece em todos os repositórios onde foi desdobrada."
          >
            {repositorios.isLoading || issues.isLoading ? (
              <p className="carregando">Carregando…</p>
            ) : null}
            {!repositorios.isLoading && !repositorios.isError && envolvidos.length === 0 ? (
              <p className="carregando">Nenhuma task encontrada nas issues desta versão.</p>
            ) : null}
            {envolvidos.length > 0 ? (
              <IssuesPorRepositorio
                repositorios={envolvidos}
                issues={carregadas}
                versao={selecionada}
              />
            ) : null}
          </CartaoGrafico>
        </div>
      ) : null}

      {selecionada ? (
        <div className="secao-repositorios">
          <CartaoGrafico
            largo
            titulo="Repositórios por issue"
            subtitulo="Cada issue da versão com os repositórios onde ela foi desdobrada em tasks. Considera todas as issues da versão, sem os filtros acima."
          >
            {repositorios.isLoading || issues.isLoading ? (
              <p className="carregando">Carregando…</p>
            ) : null}
            {!issues.isLoading && carregadas.length === 0 ? (
              <p className="carregando">Nenhuma issue vinculada a esta versão.</p>
            ) : null}
            {carregadas.length > 0 ? (
              <RepositoriosPorIssue issues={carregadas} repositorios={envolvidos} />
            ) : null}
          </CartaoGrafico>
        </div>
      ) : null}

      {!selecionada && listadas.length > 0 ? (
        <p className="carregando">Selecione uma versão para ver as issues vinculadas.</p>
      ) : null}
    </>
  );
}
