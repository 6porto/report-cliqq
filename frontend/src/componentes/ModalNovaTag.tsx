import { useEffect } from 'react';
import type { IssueDaVersao, RepositorioDaVersao, Versao } from '../api/tipos';
import { ROTULO_ACAO, versaoNaDescricao } from '../dominio/versao';

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
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const naDescricao = versaoNaDescricao(versao.descricao, repositorio.nome, versao.titulo);

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal modal-largo"
        role="dialog"
        aria-modal="true"
        aria-label={`Nova versão em ${repositorio.nome}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <div>
            <h2>Nova versão · {repositorio.nome}</h2>
            <p className="subtitulo">{repositorio.caminho}</p>
          </div>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="acao-da-versao">
          {naDescricao.tag ? (
            <span className="aviso-sincronizacao">
              Na descrição de {versao.titulo}: <strong>{naDescricao.tag}</strong>
            </span>
          ) : null}
          {naDescricao.malformada ? (
            <span className="aviso">
              A descrição de {versao.titulo} cita {repositorio.nome}, mas sem nenhuma versão
              legível na linha.
            </span>
          ) : null}
          {naDescricao.acao ? (
            <button type="button" className="aba primario" onClick={aoFechar}>
              {ROTULO_ACAO[naDescricao.acao]}
            </button>
          ) : null}
        </div>

        <h3 className="titulo-secao">Descrição da versão · {versao.titulo}</h3>
        {versao.descricao ? (
          <pre className="descricao-tag">{versao.descricao}</pre>
        ) : (
          <p className="carregando">A milestone {versao.titulo} está sem descrição no GitLab.</p>
        )}

        <h3 className="titulo-secao">
          Descrição da tag · {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </h3>
        <pre className="descricao-tag">{descricaoDaTag(issues)}</pre>
      </div>
    </div>
  );
}
