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
  operacoesLegado: string;
  operacoesCentralizado: string;
  pedidosLegadoPiloto: string;
  bugsAlta: string;
  bugsMedia: string;
  bugsBaixa: string;
  bugsDescricao: string;
  percentualAte1s: string;
  percentualAte3s: string;
  percentualErros: string;
  requisicoesAcima3s: string;
}

type CampoDeLatencia = 'percentualAte1s' | 'percentualAte3s' | 'percentualErros';
type CampoDeOperacoes = 'operacoesLegado' | 'operacoesCentralizado' | 'pedidosLegadoPiloto';

const CAMPOS_DE_LATENCIA: CampoDeLatencia[] = [
  'percentualAte1s',
  'percentualAte3s',
  'percentualErros',
];

const CAMPOS_DE_OPERACOES: CampoDeOperacoes[] = [
  'operacoesLegado',
  'operacoesCentralizado',
  'pedidosLegadoPiloto',
];

type CampoDeBugs = 'bugsAlta' | 'bugsMedia' | 'bugsBaixa';

const CAMPOS_DE_BUGS: CampoDeBugs[] = ['bugsAlta', 'bugsMedia', 'bugsBaixa'];

/** Tudo que é gravado no lançamento semanal de operações. */
const CAMPOS_DE_CONTAGEM = [...CAMPOS_DE_OPERACOES, ...CAMPOS_DE_BUGS];

const ROTULO_DO_CAMPO: Record<CampoDeOperacoes | CampoDeBugs | CampoDeLatencia, string> = {
  operacoesLegado: 'Operações no legado',
  operacoesCentralizado: 'Operações no centralizado',
  pedidosLegadoPiloto: 'Total pedidos legado piloto',
  bugsAlta: 'Alta',
  bugsMedia: 'Média',
  bugsBaixa: 'Baixa',
  percentualAte1s: '% menor que 1s',
  percentualAte3s: '% menor que 3s',
  percentualErros: '% de erros',
};

let contadorDeLinhas = 0;

function linhaVazia(semana: string): Linha {
  contadorDeLinhas += 1;

  return {
    chave: `nova-${contadorDeLinhas}`,
    semana,
    semanaOriginal: null,
    mediaId: null,
    latenciaId: null,
    operacoesLegado: '',
    operacoesCentralizado: '',
    pedidosLegadoPiloto: '',
    bugsAlta: '',
    bugsMedia: '',
    bugsBaixa: '',
    bugsDescricao: '',
    percentualAte1s: '',
    percentualAte3s: '',
    percentualErros: '',
    requisicoesAcima3s: '',
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
    linha.operacoesLegado = media.operacoesLegado === null ? '' : String(media.operacoesLegado);
    linha.operacoesCentralizado =
      media.operacoesCentralizado === null ? '' : String(media.operacoesCentralizado);
    linha.pedidosLegadoPiloto =
      media.pedidosLegadoPiloto === null ? '' : String(media.pedidosLegadoPiloto);
    linha.bugsAlta = media.bugsAlta === null ? '' : String(media.bugsAlta);
    linha.bugsMedia = media.bugsMedia === null ? '' : String(media.bugsMedia);
    linha.bugsBaixa = media.bugsBaixa === null ? '' : String(media.bugsBaixa);
    linha.bugsDescricao = media.bugsDescricao ?? '';
  });

  latencias.forEach((latencia) => {
    const linha = linhaDaSemana(paraCampoData(latencia.semana));
    linha.latenciaId = latencia.id;
    linha.percentualAte1s =
      latencia.percentualAte1s === null ? '' : String(latencia.percentualAte1s);
    linha.percentualAte3s =
      latencia.percentualAte3s === null ? '' : String(latencia.percentualAte3s);
    linha.percentualErros =
      latencia.percentualErros === null ? '' : String(latencia.percentualErros);
    linha.requisicoesAcima3s =
      latencia.requisicoesAcima3s === null ? '' : String(latencia.requisicoesAcima3s);
  });

  // Mais recentes primeiro: a semana em edição fica no topo da modal.
  return [...porSemana.values()].sort((a, b) => b.semana.localeCompare(a.semana));
}

function inteiroValido(valor: string) {
  const numero = Number(valor);

  return valor.trim() !== '' && Number.isInteger(numero) && numero >= 0;
}

/** Número não negativo, com ou sem casas decimais. */
function numeroValido(valor: string) {
  const numero = Number(valor);

  return valor.trim() !== '' && Number.isFinite(numero) && numero >= 0;
}

/** Aceita decimal: a apuração vem com casas, como 92,5%. */
function percentualValido(valor: string) {
  const numero = Number(valor);

  return valor.trim() !== '' && Number.isFinite(numero) && numero >= 0 && numero <= 100;
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
    setLinhas((atuais) => [linhaVazia(proximaSemana), ...atuais]);
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

      const contagens = CAMPOS_DE_CONTAGEM.filter((campo) => linha[campo].trim() !== '');

      if (contagens.some((campo) => !inteiroValido(linha[campo]))) {
        return 'As contagens de operações e de bugs devem ser números inteiros iguais ou maiores que zero.';
      }

      const faixas = CAMPOS_DE_LATENCIA.filter((campo) => linha[campo].trim() !== '');

      if (faixas.some((campo) => !percentualValido(linha[campo]))) {
        return 'Os percentuais de tempo de resposta devem ficar entre 0 e 100.';
      }

      if (linha.requisicoesAcima3s.trim() !== '' && !numeroValido(linha.requisicoesAcima3s)) {
        return 'As requisições acima de 3s devem ser um número igual ou maior que zero.';
      }

      const ate1s = linha.percentualAte1s.trim();
      const ate3s = linha.percentualAte3s.trim();

      if (ate1s !== '' && ate3s !== '' && Number(ate3s) < Number(ate1s)) {
        return 'O % menor que 3s inclui o de menor que 1s, então não pode ser menor que ele.';
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
        const temOperacoes =
          CAMPOS_DE_CONTAGEM.some((campo) => linha[campo].trim() !== '') ||
          linha.bugsDescricao.trim() !== '';
        const temLatencia =
          CAMPOS_DE_LATENCIA.some((campo) => linha[campo].trim() !== '') ||
          linha.requisicoesAcima3s.trim() !== '';
        const mudouDeSemana =
          linha.semanaOriginal !== null && linha.semanaOriginal !== linha.semana;

        if (temOperacoes) {
          await salvarMedia.mutateAsync({
            semana: linha.semana,
            operacoesLegado:
              linha.operacoesLegado.trim() === '' ? null : Number(linha.operacoesLegado),
            operacoesCentralizado:
              linha.operacoesCentralizado.trim() === ''
                ? null
                : Number(linha.operacoesCentralizado),
            pedidosLegadoPiloto:
              linha.pedidosLegadoPiloto.trim() === ''
                ? null
                : Number(linha.pedidosLegadoPiloto),
            bugsAlta: linha.bugsAlta.trim() === '' ? null : Number(linha.bugsAlta),
            bugsMedia: linha.bugsMedia.trim() === '' ? null : Number(linha.bugsMedia),
            bugsBaixa: linha.bugsBaixa.trim() === '' ? null : Number(linha.bugsBaixa),
            bugsDescricao: linha.bugsDescricao.trim() === '' ? null : linha.bugsDescricao.trim(),
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
            percentualAte1s:
              linha.percentualAte1s.trim() === '' ? null : Number(linha.percentualAte1s),
            percentualAte3s:
              linha.percentualAte3s.trim() === '' ? null : Number(linha.percentualAte3s),
            percentualErros:
              linha.percentualErros.trim() === '' ? null : Number(linha.percentualErros),
            requisicoesAcima3s:
              linha.requisicoesAcima3s.trim() === '' ? null : Number(linha.requisicoesAcima3s),
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
          Uma seção por semana, identificada pelo dia inicial. Deixe em branco o que ainda não
          tiver: as operações alimentam os gráficos de adesão, os percentis o de latência e as
          contagens de bugs o gráfico por criticidade. Os gráficos recarregam ao salvar.
        </p>

        {erro ? <p className="erro">{erro}</p> : null}

        <div className="lista-lancamentos">
          {carregando ? (
            <p className="carregando">Carregando…</p>
          ) : linhas.length === 0 ? (
            <p className="carregando">Nenhum lançamento ainda — use “Adicionar semana”.</p>
          ) : (
            linhas.map((linha) => (
              <section key={linha.chave} className="secao-semana">
                <header className="secao-semana-cabecalho">
                  <label className="campo">
                    <span>Semana (dia inicial)</span>
                    <input
                      type="date"
                      value={linha.semana}
                      onChange={(evento) => alterar(linha.chave, 'semana', evento.target.value)}
                    />
                  </label>
                  <button
                    className="aba perigo"
                    onClick={() => removerLinha(linha.chave)}
                    disabled={salvando}
                    aria-label={`Excluir a semana ${linha.semana}`}
                  >
                    Excluir semana
                  </button>
                </header>

                <fieldset className="grupo-campos">
                  <legend>Operações</legend>
                  <div className="grupo-campos-grade">
                    {CAMPOS_DE_OPERACOES.map((campo) => (
                      <label key={campo} className="campo">
                        <span>{ROTULO_DO_CAMPO[campo]}</span>
                        <input
                          type="number"
                          min={0}
                          value={linha[campo]}
                          onChange={(evento) => alterar(linha.chave, campo, evento.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="grupo-campos">
                  <legend>Bugs em aberto</legend>
                  <div className="grupo-campos-grade">
                    {CAMPOS_DE_BUGS.map((campo) => (
                      <label key={campo} className="campo">
                        <span>{ROTULO_DO_CAMPO[campo]}</span>
                        <input
                          type="number"
                          min={0}
                          value={linha[campo]}
                          onChange={(evento) => alterar(linha.chave, campo, evento.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <label className="campo campo-descricao">
                    <span>Descrição dos bugs</span>
                    <textarea
                      className="campo-bugs"
                      rows={3}
                      value={linha.bugsDescricao}
                      placeholder="ex.: PIX trava no 2º pedido; busca lenta acima de 500 itens"
                      onChange={(evento) =>
                        alterar(linha.chave, 'bugsDescricao', evento.target.value)
                      }
                    />
                  </label>
                </fieldset>

                <fieldset className="grupo-campos">
                  <legend>Performance / Tempo de resposta (% das requisições)</legend>
                  <div className="grupo-campos-grade">
                    {CAMPOS_DE_LATENCIA.map((campo) => (
                      <label key={campo} className="campo">
                        <span>{ROTULO_DO_CAMPO[campo]}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={linha[campo]}
                          onChange={(evento) => alterar(linha.chave, campo, evento.target.value)}
                        />
                      </label>
                    ))}
                    <label className="campo">
                      <span>Requisições acima de 3s</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={linha.requisicoesAcima3s}
                        onChange={(evento) =>
                          alterar(linha.chave, 'requisicoesAcima3s', evento.target.value)
                        }
                      />
                    </label>
                  </div>
                </fieldset>
              </section>
            ))
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
