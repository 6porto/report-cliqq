import { useEffect, useState } from 'react';
import {
  useAtualizarFilial,
  useDatasPorStatus,
  useDefinirDatas,
  useRemoverFilial,
} from '../api/hooks';
import type { DatasPorStatus, Filial, StatusRollout } from '../api/tipos';
import { ONDAS } from '../dominio/ondas';
import { COR_STATUS, ICONE_STATUS, ORDEM_DO_FLUXO_STATUS, ROTULO_STATUS } from '../tema/cores';
import { BadgeStatus } from './BadgeStatus';

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
}

type CamposDeData = Record<StatusRollout, string>;

const DATAS_VAZIAS = Object.fromEntries(
  ORDEM_DO_FLUXO_STATUS.map((status) => [status, '']),
) as CamposDeData;

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
  };
}

function ouNulo(valor: string) {
  return valor.trim() === '' ? null : valor.trim();
}

export function FormularioLoja({ loja, aoFechar }: Props) {
  const [campos, setCampos] = useState<Campos>(() => paraCampos(loja));
  const [datas, setDatas] = useState<CamposDeData>(DATAS_VAZIAS);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const datasSalvas = useDatasPorStatus(loja.id);
  const atualizarFilial = useAtualizarFilial();
  const definirDatas = useDefinirDatas();
  const removerFilial = useRemoverFilial();

  const salvando =
    atualizarFilial.isPending || definirDatas.isPending || removerFilial.isPending;

  useEffect(() => {
    setCampos(paraCampos(loja));
    setErro(null);
    setConfirmandoExclusao(false);
  }, [loja]);

  useEffect(() => {
    if (!datasSalvas.data) {
      return;
    }

    setDatas(
      Object.fromEntries(
        ORDEM_DO_FLUXO_STATUS.map((status) => [
          status,
          paraCampoData(datasSalvas.data[status]),
        ]),
      ) as CamposDeData,
    );
  }, [datasSalvas.data]);

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

  const alterarData = (status: StatusRollout) => (valor: string) =>
    setDatas((anterior) => ({ ...anterior, [status]: valor }));

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
        },
      });

      await definirDatas.mutateAsync({
        id: loja.id,
        datas: Object.fromEntries(
          ORDEM_DO_FLUXO_STATUS.map((status) => [status, ouNulo(datas[status])]),
        ) as Partial<DatasPorStatus>,
      });

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

  const ultimoStatus = [...ORDEM_DO_FLUXO_STATUS]
    .filter((status) => datas[status])
    .sort((a, b) => datas[a].localeCompare(datas[b]))
    .pop();

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
          <Campo
            rotulo="Data prevista"
            tipo="date"
            valor={campos.dataPrevista}
            aoAlterar={alterar('dataPrevista')}
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

        <section className="datas-status">
          <header>
            <h3>Datas por status</h3>
            <BadgeStatus status={ultimoStatus ?? 'NAO_INICIADO'} />
          </header>

          {datasSalvas.isLoading ? (
            <p className="carregando">Carregando histórico…</p>
          ) : (
            <div className="grade-form">
              {ORDEM_DO_FLUXO_STATUS.map((status) => (
                <label className="campo" key={status}>
                  <span>
                    <span
                      className="marca"
                      style={{ background: COR_STATUS[status] }}
                      aria-hidden
                    />
                    {ICONE_STATUS[status]} {ROTULO_STATUS[status]}
                  </span>
                  <input
                    type="date"
                    value={datas[status]}
                    onChange={(evento) => alterarData(status)(evento.target.value)}
                  />
                </label>
              ))}
            </div>
          )}

          <p className="aviso">
            Cada data preenchida vira um evento no histórico e alimenta o gráfico “Status dia a
            dia”. O status atual da loja é o da data mais recente; limpar um campo apaga o evento
            correspondente.
          </p>
        </section>

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
          <button
            className="aba primario"
            onClick={salvar}
            disabled={salvando || datasSalvas.isLoading}
          >
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
