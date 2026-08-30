import { useEffect } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useTagsDoRepositorio } from '../api/hooks';
import type { IssueDaVersao, RepositorioDaVersao, Versao } from '../api/tipos';
import { formatarData } from '../dominio/versao';

interface Props {
  repositorio: RepositorioDaVersao;
  versao: Versao;
  issues: IssueDaVersao[];
  aoFechar: () => void;
}

export function descricaoDaTag(issues: IssueDaVersao[]) {
  return issues.map((issue) => `- [#${issue.id}](${issue.url}) ${issue.titulo}`).join('\n');
}

export function ModalNovaTag({ repositorio, versao, issues, aoFechar }: Props) {
  const tags = useTagsDoRepositorio(repositorio.caminho);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const encontradas = tags.data ?? [];

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal modal-largo"
        role="dialog"
        aria-modal="true"
        aria-label={`Nova tag em ${repositorio.nome}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <div>
            <h2>Nova tag · {repositorio.nome}</h2>
            <p className="subtitulo">{repositorio.caminho}</p>
          </div>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <h3 className="titulo-secao">Descrição da versão · {versao.titulo}</h3>
        {versao.descricao ? (
          <pre className="descricao-tag">{versao.descricao}</pre>
        ) : (
          <p className="carregando">A milestone {versao.titulo} está sem descrição no GitLab.</p>
        )}

        <h3 className="titulo-secao">Últimas três minors</h3>
        {tags.isError ? <p className="erro">{mensagemDoErro(tags.error)}</p> : null}
        {tags.isLoading ? <p className="carregando">Carregando as tags…</p> : null}
        {!tags.isLoading && !tags.isError && encontradas.length === 0 ? (
          <p className="carregando">Nenhuma tag no padrão de versão neste repositório.</p>
        ) : null}
        {encontradas.length > 0 ? (
          <ul className="lista-tags">
            {encontradas.map((tag) => (
              <li key={tag.nome}>
                <span className="tag-nome">{tag.nome}</span>
                <span className="tag-minor">minor {tag.minor}</span>
                <span className="tag-data">{formatarData(tag.criadaEm)}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <h3 className="titulo-secao">
          Descrição da tag · {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </h3>
        <pre className="descricao-tag">{descricaoDaTag(issues)}</pre>
      </div>
    </div>
  );
}
