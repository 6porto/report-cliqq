import { useEffect, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import {
  useMediasSemanais,
  useRemoverMediaSemanal,
  useSalvarMediaSemanal,
} from '../api/hooks';
import type { MediaSemanal } from '../api/tipos';
import { formatarSemanaCompleta, hoje, paraCampoData } from '../dominio/semanas';

interface Props {
  aoFechar: () => void;
}

export function ModalMediasSemanais({ aoFechar }: Props) {
  const medias = useMediasSemanais();
  const salvarMedia = useSalvarMediaSemanal();
  const removerMedia = useRemoverMediaSemanal();

  const [semana, setSemana] = useState(hoje);
  const [mediaOperacoes, setMediaOperacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<number | null>(null);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const lancamentos = [...(medias.data ?? [])].reverse();
  const salvando = salvarMedia.isPending || removerMedia.isPending;
  const jaLancada = (medias.data ?? []).some(
    (media) => paraCampoData(media.semana) === semana,
  );

  const salvar = async () => {
    setErro(null);

    if (!semana) {
      setErro('Informe o dia inicial da semana.');
      return;
    }

    const numero = Number(mediaOperacoes);

    if (mediaOperacoes.trim() === '' || !Number.isInteger(numero) || numero < 0) {
      setErro('A média deve ser um número inteiro igual ou maior que zero.');
      return;
    }

    try {
      await salvarMedia.mutateAsync({ semana, mediaOperacoes: numero });
      setMediaOperacoes('');
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  };

  const editar = (media: MediaSemanal) => {
    setSemana(paraCampoData(media.semana));
    setMediaOperacoes(String(media.mediaOperacoes));
    setConfirmandoExclusao(null);
    setErro(null);
  };

  const remover = async (id: number) => {
    setErro(null);

    try {
      await removerMedia.mutateAsync(id);
      setConfirmandoExclusao(null);
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  };

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Lançamentos de média de operações por semana"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <h2>Média de operações por semana</h2>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="lancamento-semana">
          <label className="campo">
            <span>Semana (dia inicial)</span>
            <input
              type="date"
              value={semana}
              onChange={(evento) => setSemana(evento.target.value)}
            />
          </label>
          <label className="campo">
            <span>Média de operações/dia</span>
            <input
              type="number"
              min={0}
              value={mediaOperacoes}
              placeholder="ex.: 13050"
              onChange={(evento) => setMediaOperacoes(evento.target.value)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') {
                  void salvar();
                }
              }}
            />
          </label>
          <button className="aba primario" onClick={salvar} disabled={salvando}>
            {salvarMedia.isPending ? 'Salvando…' : jaLancada ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>

        <p className="aviso">
          {jaLancada
            ? 'Essa semana já tem lançamento — salvar substitui o valor registrado.'
            : 'Um lançamento por semana, identificado pelo dia inicial: salvar a mesma data de novo corrige o valor.'}
        </p>

        {erro ? <p className="erro">{erro}</p> : null}

        <div className="tabela-envolucro lista-lancamentos">
          {medias.isLoading ? (
            <p className="carregando">Carregando…</p>
          ) : lancamentos.length === 0 ? (
            <p className="carregando">Nenhum lançamento registrado ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Semana de</th>
                  <th style={{ textAlign: 'right' }}>Média de operações/dia</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((media) => (
                  <tr key={media.id}>
                    <td>{formatarSemanaCompleta(paraCampoData(media.semana))}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {media.mediaOperacoes.toLocaleString('pt-BR')}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {confirmandoExclusao === media.id ? (
                        <>
                          <button
                            className="aba perigo"
                            onClick={() => remover(media.id)}
                            disabled={salvando}
                          >
                            Confirmar
                          </button>{' '}
                          <button
                            className="aba"
                            onClick={() => setConfirmandoExclusao(null)}
                            disabled={salvando}
                          >
                            Manter
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="aba"
                            onClick={() => editar(media)}
                            disabled={salvando}
                          >
                            Editar
                          </button>{' '}
                          <button
                            className="aba perigo"
                            onClick={() => setConfirmandoExclusao(media.id)}
                            disabled={salvando}
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="acoes-form">
          <span style={{ flex: 1 }} />
          <button className="aba" onClick={aoFechar} disabled={salvando}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
