import { useEffect, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { useMelhorias, useRemoverMelhoria, useSalvarMelhoria } from '../api/hooks';
import type { Melhoria } from '../api/tipos';
import { formatarSemanaCompleta, hoje, paraCampoData } from '../dominio/semanas';

interface Props {
  aoFechar: () => void;
}

export function ModalMelhorias({ aoFechar }: Props) {
  const melhorias = useMelhorias();
  const salvarMelhoria = useSalvarMelhoria();
  const removerMelhoria = useRemoverMelhoria();

  const [emEdicao, setEmEdicao] = useState<number | null>(null);
  const [descricao, setDescricao] = useState('');
  const [dataPrevista, setDataPrevista] = useState(hoje);
  const [subiuEmProducao, setSubiuEmProducao] = useState(false);
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

  const salvando = salvarMelhoria.isPending || removerMelhoria.isPending;

  const limpar = () => {
    setEmEdicao(null);
    setDescricao('');
    setDataPrevista(hoje());
    setSubiuEmProducao(false);
    setErro(null);
  };

  const salvar = async () => {
    if (descricao.trim() === '') {
      setErro('Descreva a melhoria antes de salvar.');
      return;
    }

    setErro(null);

    try {
      await salvarMelhoria.mutateAsync({
        id: emEdicao ?? undefined,
        descricao: descricao.trim(),
        dataPrevista: dataPrevista === '' ? null : dataPrevista,
        subiuEmProducao,
      });

      limpar();
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  };

  const editar = (melhoria: Melhoria) => {
    setEmEdicao(melhoria.id);
    setDescricao(melhoria.descricao);
    setDataPrevista(melhoria.dataPrevista ? paraCampoData(melhoria.dataPrevista) : '');
    setSubiuEmProducao(melhoria.subiuEmProducao);
    setConfirmandoExclusao(null);
    setErro(null);
  };

  const remover = async (id: number) => {
    setErro(null);

    try {
      await removerMelhoria.mutateAsync(id);
      setConfirmandoExclusao(null);

      if (emEdicao === id) {
        limpar();
      }
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  };

  const lista = melhorias.data ?? [];

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal modal-largo"
        role="dialog"
        aria-modal="true"
        aria-label="Melhorias previstas"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <h2>{emEdicao === null ? 'Melhorias' : 'Editando melhoria'}</h2>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <p className="aviso">
          Cadastre o que está previsto para subir. Marque “já subiu para produção” quando a
          melhoria entrar no ar — a data da subida é registrada nesse momento.
        </p>

        {erro ? <p className="erro">{erro}</p> : null}

        <div className="formulario-melhoria">
          <label className="campo campo-descricao-melhoria">
            <span>Descrição</span>
            <textarea
              rows={2}
              value={descricao}
              placeholder="ex.: Ajuste no cálculo de frete para múltiplos volumes"
              onChange={(evento) => setDescricao(evento.target.value)}
            />
          </label>

          <label className="campo">
            <span>Data prevista</span>
            <input
              type="date"
              value={dataPrevista}
              onChange={(evento) => setDataPrevista(evento.target.value)}
            />
          </label>

          <label className="filtro-serie campo-subiu">
            <input
              type="checkbox"
              checked={subiuEmProducao}
              onChange={(evento) => setSubiuEmProducao(evento.target.checked)}
            />
            Já subiu para produção
          </label>

          <div className="acoes-melhoria">
            {emEdicao !== null ? (
              <button className="aba" onClick={limpar} disabled={salvando}>
                Cancelar
              </button>
            ) : null}
            <button className="aba primario" onClick={salvar} disabled={salvando}>
              {salvarMelhoria.isPending
                ? 'Salvando…'
                : emEdicao === null
                  ? 'Adicionar'
                  : 'Salvar'}
            </button>
          </div>
        </div>

        <div className="tabela-envolucro lista-lancamentos">
          {melhorias.isLoading ? (
            <p className="carregando">Carregando…</p>
          ) : lista.length === 0 ? (
            <p className="carregando">Nenhuma melhoria cadastrada ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Prevista para</th>
                  <th>Situação</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {lista.map((melhoria) => (
                  <tr key={melhoria.id}>
                    <td style={{ whiteSpace: 'normal' }}>{melhoria.descricao}</td>
                    <td>
                      {melhoria.dataPrevista
                        ? formatarSemanaCompleta(paraCampoData(melhoria.dataPrevista))
                        : '—'}
                    </td>
                    <td>
                      {melhoria.subiuEmProducao
                        ? `✓ No ar${
                            melhoria.dataSubida
                              ? ` em ${formatarSemanaCompleta(paraCampoData(melhoria.dataSubida))}`
                              : ''
                          }`
                        : '○ Prevista'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {confirmandoExclusao === melhoria.id ? (
                        <>
                          <button
                            className="aba perigo"
                            onClick={() => remover(melhoria.id)}
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
                            onClick={() => editar(melhoria)}
                            disabled={salvando}
                          >
                            Editar
                          </button>{' '}
                          <button
                            className="aba perigo"
                            onClick={() => setConfirmandoExclusao(melhoria.id)}
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
