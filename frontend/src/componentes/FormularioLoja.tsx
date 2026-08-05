import { useEffect, useState } from 'react';
import { useAtualizarFilial, useAtualizarStatus, useRemoverFilial } from '../api/hooks';
import type { Filial, StatusRollout } from '../api/tipos';
import { ONDAS } from '../dominio/ondas';
import { ORDEM_PILHA_STATUS, ROTULO_STATUS, STATUS_EM_IMPLANTACAO } from '../tema/cores';

interface Props {
  loja: Filial;
  aoFechar: () => void;
}

interface Campos {
  codigo: string;
  cidade: string;
  uf: string;
  regional: string;
  onda: string;
  mediaOperacoes90Dias: string;
  observacao: string;
  dataPrevista: string;
  dataInicio: string;
  dataConclusao: string;
  status: StatusRollout;
}

function paraCampoData(valor: string | null) {
  return valor ? valor.slice(0, 10) : '';
}

function paraCampos(loja: Filial): Campos {
  return {
    codigo: loja.codigo,
    cidade: loja.cidade ?? '',
    uf: loja.uf ?? '',
    regional: loja.regional ?? '',
    onda: loja.onda ?? '',
    mediaOperacoes90Dias: String(loja.mediaOperacoes90Dias),
    observacao: loja.observacao ?? '',
    dataPrevista: paraCampoData(loja.dataPrevista),
    dataInicio: paraCampoData(loja.dataInicio),
    dataConclusao: paraCampoData(loja.dataConclusao),
    status: loja.status,
  };
}

function ouNulo(valor: string) {
  return valor.trim() === '' ? null : valor.trim();
}

export function FormularioLoja({ loja, aoFechar }: Props) {
  const [campos, setCampos] = useState<Campos>(() => paraCampos(loja));
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const atualizarFilial = useAtualizarFilial();
  const atualizarStatus = useAtualizarStatus();
  const removerFilial = useRemoverFilial();

  const salvando =
    atualizarFilial.isPending || atualizarStatus.isPending || removerFilial.isPending;

  useEffect(() => {
    setCampos(paraCampos(loja));
    setErro(null);
    setConfirmandoExclusao(false);
  }, [loja]);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const alterar = (campo: keyof Campos) => (valor: string) =>
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));

  const salvar = async () => {
    setErro(null);

    if (!campos.codigo.trim()) {
      setErro('Código é obrigatório.');
      return;
    }

    try {
      await atualizarFilial.mutateAsync({
        id: loja.id,
        cadastro: {
          codigo: campos.codigo.trim(),
          cidade: ouNulo(campos.cidade),
          uf: ouNulo(campos.uf),
          regional: ouNulo(campos.regional),
          onda: ouNulo(campos.onda),
          mediaOperacoes90Dias: Number(campos.mediaOperacoes90Dias) || 0,
          observacao: ouNulo(campos.observacao),
          dataPrevista: ouNulo(campos.dataPrevista),
          dataInicio: ouNulo(campos.dataInicio),
          dataConclusao: ouNulo(campos.dataConclusao),
        },
      });

      if (campos.status !== loja.status) {
        const dataDoEvento =
          campos.status === 'CONCLUIDO'
            ? ouNulo(campos.dataConclusao)
            : STATUS_EM_IMPLANTACAO.includes(campos.status)
              ? ouNulo(campos.dataInicio)
              : null;

        await atualizarStatus.mutateAsync({
          id: loja.id,
          status: campos.status,
          data: dataDoEvento ?? undefined,
          observacao: ouNulo(campos.observacao) ?? undefined,
        });
      }

      aoFechar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha ao salvar');
    }
  };

  const excluir = async () => {
    setErro(null);

    try {
      await removerFilial.mutateAsync(loja.id);
      aoFechar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha ao excluir');
    }
  };

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Editar loja ${loja.codigo}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <h2>Editar loja {loja.codigo}</h2>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="grade-form">
          <Campo rotulo="Código" valor={campos.codigo} aoAlterar={alterar('codigo')} />
          <Campo rotulo="Cidade" valor={campos.cidade} aoAlterar={alterar('cidade')} />
          <Campo
            rotulo="UF"
            valor={campos.uf}
            aoAlterar={(valor) => alterar('uf')(valor.toUpperCase().slice(0, 2))}
          />
          <Campo rotulo="Regional" valor={campos.regional} aoAlterar={alterar('regional')} />

          <label className="campo">
            <span>Onda</span>
            <select value={campos.onda} onChange={(evento) => alterar('onda')(evento.target.value)}>
              <option value="">Sem onda</option>
              {(ONDAS.includes(campos.onda) || campos.onda === ''
                ? ONDAS
                : [...ONDAS, campos.onda]
              ).map((onda) => (
                <option key={onda} value={onda}>
                  {onda}
                </option>
              ))}
            </select>
          </label>

          <Campo
            rotulo="Média operações 90 dias"
            tipo="number"
            valor={campos.mediaOperacoes90Dias}
            aoAlterar={alterar('mediaOperacoes90Dias')}
          />
          <label className="campo">
            <span>Status</span>
            <select
              value={campos.status}
              onChange={(evento) => alterar('status')(evento.target.value)}
            >
              {ORDEM_PILHA_STATUS.map((status) => (
                <option key={status} value={status}>
                  {ROTULO_STATUS[status]}
                </option>
              ))}
            </select>
          </label>

          <Campo
            rotulo="Data prevista"
            tipo="date"
            valor={campos.dataPrevista}
            aoAlterar={alterar('dataPrevista')}
          />
          <Campo
            rotulo="Data de início"
            tipo="date"
            valor={campos.dataInicio}
            aoAlterar={alterar('dataInicio')}
          />
          <Campo
            rotulo="Data de conclusão"
            tipo="date"
            valor={campos.dataConclusao}
            aoAlterar={alterar('dataConclusao')}
          />

          <label className="campo campo-largo">
            <span>Observação</span>
            <textarea
              rows={3}
              value={campos.observacao}
              onChange={(evento) => alterar('observacao')(evento.target.value)}
            />
          </label>
        </div>

        {campos.status !== loja.status ? (
          <p className="aviso">
            A mudança de status grava um evento no histórico
            {campos.status === 'CONCLUIDO' || STATUS_EM_IMPLANTACAO.includes(campos.status)
              ? ' e usa a data informada acima (ou hoje, se vazia).'
              : '.'}
          </p>
        ) : null}

        {erro ? <p className="erro">{erro}</p> : null}

        <footer className="acoes-form">
          {confirmandoExclusao ? (
            <>
              <span className="erro" style={{ margin: 0 }}>
                Excluir a loja {loja.codigo} e todo o histórico dela?
              </span>
              <button className="aba perigo" onClick={excluir} disabled={salvando}>
                {removerFilial.isPending ? 'Excluindo…' : 'Confirmar exclusão'}
              </button>
              <button
                className="aba"
                onClick={() => setConfirmandoExclusao(false)}
                disabled={salvando}
              >
                Manter loja
              </button>
            </>
          ) : (
            <button
              className="aba perigo"
              onClick={() => setConfirmandoExclusao(true)}
              disabled={salvando}
            >
              Excluir
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button className="aba" onClick={aoFechar} disabled={salvando}>
            Cancelar
          </button>
          <button className="aba primario" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </footer>
      </div>
    </div>
  );
}

interface CampoProps {
  rotulo: string;
  valor: string;
  aoAlterar: (valor: string) => void;
  tipo?: string;
  largo?: boolean;
}

function Campo({ rotulo, valor, aoAlterar, tipo = 'text', largo }: CampoProps) {
  return (
    <label className={largo ? 'campo campo-largo' : 'campo'}>
      <span>{rotulo}</span>
      <input type={tipo} value={valor} onChange={(evento) => aoAlterar(evento.target.value)} />
    </label>
  );
}
