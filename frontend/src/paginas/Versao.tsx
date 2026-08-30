import { useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useIssuesDaVersao, useRepositoriosDaVersao, useVersoes } from '../api/hooks';
import { AssistenteDeVersao } from '../componentes/AssistenteDeVersao';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { IssuesPorRepositorio } from '../componentes/IssuesPorRepositorio';
import { PREFIXOS_DE_VERSAO, ehVersaoAtiva } from '../dominio/versao';

export function Versao() {
  const versoes = useVersoes();
  const [incluirFechadas, setIncluirFechadas] = useState(false);
  const [versaoSelecionada, setVersaoSelecionada] = useState<string | null>(null);

  const issues = useIssuesDaVersao(versaoSelecionada);
  const repositorios = useRepositoriosDaVersao(versaoSelecionada);

  const todasAsVersoes = versoes.data ?? [];
  const listadas = incluirFechadas ? todasAsVersoes : todasAsVersoes.filter(ehVersaoAtiva);
  const selecionada = todasAsVersoes.find((versao) => versao.titulo === versaoSelecionada) ?? null;

  const carregadas = useMemo(() => issues.data ?? [], [issues.data]);
  const envolvidos = useMemo(() => repositorios.data?.repositorios ?? [], [repositorios.data]);

  return (
    <>
      <AssistenteDeVersao />

      <div className="barra-sincronizacao">
        <div className="filtros">
          <select
            value={versaoSelecionada ?? ''}
            aria-label="Selecionar versão"
            disabled={versoes.isLoading}
            onChange={(evento) => setVersaoSelecionada(evento.target.value || null)}
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
          {selecionada ? (
            <a className="aba" href={selecionada.url} target="_blank" rel="noreferrer">
              Abrir no GitLab
            </a>
          ) : null}
        </div>
        <p className="subtitulo">
          Milestones de <code>mercantil/mercantil</code> que começam com{' '}
          <code>{PREFIXOS_DE_VERSAO[0]}</code> ou <code>{PREFIXOS_DE_VERSAO[1]}</code>
        </p>
      </div>

      {versoes.isError ? <p className="erro">{mensagemDoErro(versoes.error)}</p> : null}
      {issues.isError ? <p className="erro">{mensagemDoErro(issues.error)}</p> : null}
      {repositorios.isError ? (
        <p className="erro">{mensagemDoErro(repositorios.error)}</p>
      ) : null}

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
      ) : null}

      {!selecionada && listadas.length > 0 ? (
        <p className="carregando">Selecione uma versão para ver os repositórios envolvidos.</p>
      ) : null}
    </>
  );
}
