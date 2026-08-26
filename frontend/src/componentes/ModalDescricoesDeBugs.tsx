import { useEffect } from 'react';
import type { MediaSemanal } from '../api/tipos';
import { formatarSemanaCompleta, paraCampoData } from '../dominio/semanas';

interface Props {
  semanas: MediaSemanal[];
  aoFechar: () => void;
}

export function ModalDescricoesDeBugs({ semanas, aoFechar }: Props) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const comDescricao = [...semanas]
    .filter((semana) => (semana.bugsDescricao ?? '').trim() !== '')
    .sort((a, b) => b.semana.localeCompare(a.semana));

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Descrições dos bugs por semana"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <h2>Descrições dos bugs</h2>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        {comDescricao.length === 0 ? (
          <p className="carregando">
            Nenhuma descrição registrada — preencha a coluna “Descrição dos bugs” em “Lançamentos
            por semana”.
          </p>
        ) : (
          <ul className="lista-descricoes">
            {comDescricao.map((semana) => (
              <li key={semana.id}>
                <p className="descricao-semana">
                  <strong>Semana de {formatarSemanaCompleta(paraCampoData(semana.semana))}</strong>
                  <span>
                    {semana.bugsAlta ?? 0} alta · {semana.bugsMedia ?? 0} média ·{' '}
                    {semana.bugsBaixa ?? 0} baixa
                  </span>
                </p>
                <p className="descricao-texto">{semana.bugsDescricao}</p>
              </li>
            ))}
          </ul>
        )}

        <footer className="acoes-form">
          <span style={{ flex: 1 }} />
          <button className="aba" onClick={aoFechar}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
