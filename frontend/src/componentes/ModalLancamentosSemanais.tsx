import { useEffect, useMemo, useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import {
  useLatenciasSemanais,
  useMediasSemanais,
  useRemoverLatenciaSemanal,
  useRemoverMediaSemanal,
  useSalvarLatenciaSemanal,
  useSalvarMediaSemanal,
} from '../api/hooks';
import type { LatenciaSemanal, MediaSemanal } from '../api/tipos';
import { hoje, paraCampoData } from '../dominio/semanas';

interface Props {
  aoFechar: () => void;
}

interface Linha {
  chave: string;
  semana: string;
  /** Semana como está gravada hoje; muda só depois de salvar. */
  semanaOriginal: string | null;
  mediaId: number | null;
  latenciaId: number | null;
  mediaOperacoes: string;
  operacoesLegado: string;
  operacoesCentralizado: string;
  p50: string;
  p75: string;
  p95: string;
  p99: string;
}

type CampoDeLatencia = 'p50' | 'p75' | 'p95' | 'p99';
type CampoDeOperacoes = 'operacoesLegado' | 'operacoesCentralizado';

const CAMPOS_DE_LATENCIA: CampoDeLatencia[] = ['p50', 'p75', 'p95', 'p99'];

const CAMPOS_DE_OPERACOES: CampoDeOperacoes[] = ['operacoesLegado', 'operacoesCentralizado'];

let contadorDeLinhas = 0;

function linhaVazia(semana: string): Linha {
  contadorDeLinhas += 1;

  return {
    chave: `nova-${contadorDeLinhas}`,
    semana,
    semanaOriginal: null,
    mediaId: null,
    latenciaId: null,
    mediaOperacoes: '',
    operacoesLegado: '',
    operacoesCentralizado: '',
    p50: '',
    p75: '',
    p95: '',
    p99: '',
  };
}

function montarLinhas(medias: MediaSemanal[], latencias: LatenciaSemanal[]): Linha[] {
  const porSemana = new Map<string, Linha>();

  const linhaDaSemana = (semana: string) => {
    const existente = porSemana.get(semana);

    if (existente) {
      return existente;
    }

    const linha: Linha = {
      ...linhaVazia(semana),
      chave: semana,
      semana,
      semanaOriginal: semana,
    };
    porSemana.set(semana, linha);

    return linha;
  };

  medias.forEach((media) => {
    const linha = linhaDaSemana(paraCampoData(media.semana));
    linha.mediaId = media.id;
    linha.mediaOperacoes = String(media.mediaOperacoes);
    linha.operacoesLegado = media.operacoesLegado === null ? '' : String(media.operacoesLegado);
    linha.operacoesCentralizado =
      media.operacoesCentralizado === null ? '' : String(media.operacoesCentralizado);
  });

  latencias.forEach((latencia) => {
    const linha = linhaDaSemana(paraCampoData(latencia.semana));
    linha.latenciaId = latencia.id;
    linha.p50 = String(latencia.p50);
    linha.p75 = String(latencia.p75);
    linha.p95 = String(latencia.p95);
    linha.p99 = String(latencia.p99);
  });

  return [...porSemana.values()].sort((a, b) => a.semana.localeCompare(b.semana));
}

function inteiroValido(valor: string) {
  const numero = Number(valor);

  return valor.trim() !== '' && Number.isInteger(numero) && numero >= 0;
}

export function ModalLancamentosSemanais({ aoFechar }: Props) {
  const medias = useMediasSemanais();
  const latencias = useLatenciasSemanais();
  const salvarMedia = useSalvarMediaSemanal();
  const salvarLatencia = useSalvarLatenciaSemanal();
  const removerMedia = useRemoverMediaSemanal();
  const removerLatencia = useRemoverLatenciaSemanal();

  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [sujo, setSujo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const carregando = medias.isLoading || latencias.isLoading;

  useEffect(() => {
    if (sujo || !medias.data || !latencias.data) {
      return;
    }

    setLinhas(montarLinhas(medias.data, latencias.data));
  }, [medias.data, latencias.data, sujo]);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  const salvando =
    salvarMedia.isPending ||
    salvarLatencia.isPending ||
    removerMedia.isPending ||
    removerLatencia.isPending;

  const proximaSemana = useMemo(() => {
    const ultima = [...linhas].sort((a, b) => a.semana.localeCompare(b.semana)).at(-1);

    if (!ultima?.semana) {
      return hoje();
    }

    const [ano, mes, dia] = ultima.semana.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia + 7);

    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(
      data.getDate(),
    ).padStart(2, '0')}`;
  }, [linhas]);

  const alterar = (chave: string, campo: keyof Linha, valor: string) => {
    setSujo(true);
    setSalvo(false);
    setErro(null);
    setLinhas((atuais) =>
      atuais.map((linha) => (linha.chave === chave ? { ...linha, [campo]: valor } : linha)),
    );
  };

  const adicionarLinha = () => {
    setSujo(true);
    setSalvo(false);
    setLinhas((atuais) => [...atuais, linhaVazia(proximaSemana)]);
  };

  const removerLinha = async (chave: string) => {
    const linha = linhas.find((item) => item.chave === chave);

    if (!linha) {
      return;
    }

    setErro(null);

    try {
      if (linha.mediaId !== null) {
        await removerMedia.mutateAsync(linha.mediaId);
      }

      if (linha.latenciaId !== null) {
        await removerLatencia.mutateAsync(linha.latenciaId);
      }
    } catch (falha) {
      setErro(mensagemDoErro(falha));
      return;
    }

    setLinhas((atuais) => atuais.filter((item) => item.chave !== chave));
  };

  const validar = () => {
    const semanas = new Set<string>();

    for (const linha of linhas) {
      if (!linha.semana) {
        return 'Toda linha precisa do dia inicial da semana.';
      }

      if (semanas.has(linha.semana)) {
        return `A semana ${linha.semana.split('-').reverse().join('/')} aparece em duas linhas — use uma linha por semana.`;
      }

      semanas.add(linha.semana);

      if (linha.mediaOperacoes.trim() !== '' && !inteiroValido(linha.mediaOperacoes)) {
        return 'A média de operações deve ser um número inteiro igual ou maior que zero.';
      }

      const operacoesPorSistema = CAMPOS_DE_OPERACOES.filter(
        (campo) => linha[campo].trim() !== '',
      );

      if (operacoesPorSistema.some((campo) => !inteiroValido(linha[campo]))) {
        return 'As operações do legado e do centralizado devem ser números inteiros iguais ou maiores que zero.';
      }

      if (operacoesPorSistema.length > 0 && linha.mediaOperacoes.trim() === '') {
        return 'Informe a média de operações da semana para gravar as operações do legado e do centralizado.';
      }

      const preenchidos = CAMPOS_DE_LATENCIA.filter((campo) => linha[campo].trim() !== '');

      if (preenchidos.length > 0 && preenchidos.length < CAMPOS_DE_LATENCIA.length) {
        return 'Para lançar latência, preencha P50, P75, P95 e P99 da semana.';
      }

      if (preenchidos.some((campo) => !inteiroValido(linha[campo]))) {
        return 'As latências devem ser números inteiros iguais ou maiores que zero.';
      }
    }

    return null;
  };

  const salvar = async () => {
    const invalido = validar();

    if (invalido) {
      setErro(invalido);
      setSalvo(false);
      return;
    }

    setErro(null);

    try {
      for (const linha of linhas) {
        const temMedia = linha.mediaOperacoes.trim() !== '';
        const temLatencia = CAMPOS_DE_LATENCIA.every((campo) => linha[campo].trim() !== '');
        const mudouDeSemana =
          linha.semanaOriginal !== null && linha.semanaOriginal !== linha.semana;

        if (temMedia) {
          await salvarMedia.mutateAsync({
            semana: linha.semana,
            mediaOperacoes: Number(linha.mediaOperacoes),
            operacoesLegado:
              linha.operacoesLegado.trim() === '' ? null : Number(linha.operacoesLegado),
            operacoesCentralizado:
              linha.operacoesCentralizado.trim() === ''
                ? null
                : Number(linha.operacoesCentralizado),
          });

          if (mudouDeSemana && linha.mediaId !== null) {
            await removerMedia.mutateAsync(linha.mediaId);
          }
        } else if (linha.mediaId !== null) {
          await removerMedia.mutateAsync(linha.mediaId);
        }

        if (temLatencia) {
          await salvarLatencia.mutateAsync({
            semana: linha.semana,
            p50: Number(linha.p50),
            p75: Number(linha.p75),
            p95: Number(linha.p95),
            p99: Number(linha.p99),
          });

          if (mudouDeSemana && linha.latenciaId !== null) {
            await removerLatencia.mutateAsync(linha.latenciaId);
          }
        } else if (linha.latenciaId !== null) {
          await removerLatencia.mutateAsync(linha.latenciaId);
        }
      }

      setSujo(false);
      setSalvo(true);
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  };

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div
        className="modal modal-largo"
        role="dialog"
        aria-modal="true"
        aria-label="Lançamentos semanais de operações e latência"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="modal-cabecalho">
          <h2>Lançamentos por semana</h2>
          <button className="aba" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </header>

        <p className="aviso">
          Uma linha por semana, identificada pelo dia inicial. A média alimenta o gráfico de
          operações, os quatro percentis alimentam o de latência e as operações por sistema ficam
          registradas junto da semana — deixe em branco o que ainda não tiver. Os gráficos
          recarregam ao salvar.
        </p>

        {erro ? <p className="erro">{erro}</p> : null}

        <div className="tabela-envolucro lista-lancamentos">
          {carregando ? (
            <p className="carregando">Carregando…</p>
          ) : (
            <table className="grade-lancamentos">
              <thead>
                <tr>
                  <th>Semana (dia inicial)</th>
                  <th>Média de operações/dia</th>
                  <th>Operações no legado</th>
                  <th>Operações no centralizado</th>
                  <th>P50 (ms)</th>
                  <th>P75 (ms)</th>
                  <th>P95 (ms)</th>
                  <th>P99 (ms)</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {linhas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="carregando">
                      Nenhum lançamento ainda — use “Adicionar semana”.
                    </td>
                  </tr>
                ) : (
                  linhas.map((linha) => (
                    <tr key={linha.chave}>
                      <td>
                        <input
                          type="date"
                          value={linha.semana}
                          onChange={(evento) => alterar(linha.chave, 'semana', evento.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={linha.mediaOperacoes}
                          placeholder="ex.: 13050"
                          onChange={(evento) =>
                            alterar(linha.chave, 'mediaOperacoes', evento.target.value)
                          }
                        />
                      </td>
                      {CAMPOS_DE_OPERACOES.map((campo) => (
                        <td key={campo}>
                          <input
                            type="number"
                            min={0}
                            value={linha[campo]}
                            onChange={(evento) => alterar(linha.chave, campo, evento.target.value)}
                          />
                        </td>
                      ))}
                      {CAMPOS_DE_LATENCIA.map((campo) => (
                        <td key={campo}>
                          <input
                            type="number"
                            min={0}
                            value={linha[campo]}
                            onChange={(evento) => alterar(linha.chave, campo, evento.target.value)}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          className="aba perigo"
                          onClick={() => removerLinha(linha.chave)}
                          disabled={salvando}
                          aria-label={`Excluir a semana ${linha.semana}`}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <footer className="acoes-form">
          <button className="aba" onClick={adicionarLinha} disabled={salvando}>
            + Adicionar semana
          </button>
          <span style={{ flex: 1 }}>
            {salvo && !sujo ? <span className="aviso-salvo">Lançamentos salvos.</span> : null}
          </span>
          <button className="aba" onClick={aoFechar} disabled={salvando}>
            Fechar
          </button>
          <button className="aba primario" onClick={salvar} disabled={salvando || !sujo}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </footer>
      </div>
    </div>
  );
}
