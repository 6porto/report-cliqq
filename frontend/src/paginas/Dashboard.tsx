import { useState } from 'react';
import {
  useLatenciasSemanais,
  useMediasSemanais,
  useOndas,
  useResumo,
  useStatusPorDia,
  useUf,
} from '../api/hooks';
import type { StatusRollout } from '../api/tipos';
import { REGRA_DAS_ONDAS } from '../dominio/ondas';
import { COR_STATUS, ICONE_STATUS } from '../tema/cores';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { GraficoAdesaoCentralizado } from '../componentes/GraficoAdesaoCentralizado';
import { GraficoBugsPorCriticidade } from '../componentes/GraficoBugsPorCriticidade';
import { GraficoGrupos } from '../componentes/GraficoGrupos';
import { GraficoMediaDiaria } from '../componentes/GraficoMediaDiaria';
import { GraficoStatus } from '../componentes/GraficoStatus';
import { GraficoStatusPorDia } from '../componentes/GraficoStatusPorDia';
import { GraficoLatenciaSemanal } from '../componentes/GraficoLatenciaSemanal';
import { GraficoMediaSemanal } from '../componentes/GraficoMediaSemanal';
import { RoscaProporcao } from '../componentes/RoscaProporcao';
import { ListaProximasMelhorias } from '../componentes/ListaProximasMelhorias';
import { ModalDescricoesDeBugs } from '../componentes/ModalDescricoesDeBugs';
import { ModalMelhorias } from '../componentes/ModalMelhorias';
import { ModalLancamentosSemanais } from '../componentes/ModalLancamentosSemanais';

/** Fora do rollout: ainda não começaram ou estão travadas. */
const STATUS_FORA_DO_CENTRALIZADO: StatusRollout[] = ['NAO_INICIADO', 'BLOQUEADO'];

/** % do total que já roda no centralizado, pronto para o miolo da rosca. */
function formatarAdesao(centralizado: number, legado: number) {
  const total = centralizado + legado;

  if (total <= 0) {
    return '—';
  }

  return `${Number(((centralizado / total) * 100).toFixed(1)).toLocaleString('pt-BR')}%`;
}

export function Dashboard() {
  const resumo = useResumo();
  const porUf = useUf();
  const porOnda = useOndas();
  const statusPorDia = useStatusPorDia();
  const medias = useMediasSemanais();
  const latencias = useLatenciasSemanais();
  const [lancamentosAbertos, setLancamentosAbertos] = useState(false);
  const [descricoesAbertas, setDescricoesAbertas] = useState(false);
  const [melhoriasAbertas, setMelhoriasAbertas] = useState(false);

  if (resumo.isLoading || !resumo.data) {
    return <p className="carregando">Carregando indicadores…</p>;
  }

  const dados = resumo.data;

  const semanasLancadas = new Set([
    ...(medias.data ?? []).map((media) => media.semana),
    ...(latencias.data ?? []).map((latencia) => latencia.semana),
  ]).size;

  const semanasComDescricao = (medias.data ?? []).filter(
    (media) => (media.bugsDescricao ?? '').trim() !== '',
  ).length;

  const semanasComOperacoes = [...(medias.data ?? [])]
    .filter((media) => media.operacoesLegado !== null || media.operacoesCentralizado !== null)
    .sort((a, b) => a.semana.localeCompare(b.semana));

  const ultimaSemanaCrua = semanasComOperacoes.at(-1);
  const semanaAnteriorCrua = semanasComOperacoes.at(-2);

  const adesaoDaRede = (media: (typeof semanasComOperacoes)[number] | undefined) => {
    if (!media) {
      return null;
    }

    const centralizado = media.operacoesCentralizado ?? 0;
    const total = centralizado + (media.operacoesLegado ?? 0);

    return total > 0 ? (centralizado / total) * 100 : null;
  };

  const adesaoDoPiloto = (media: (typeof semanasComOperacoes)[number] | undefined) => {
    if (!media) {
      return null;
    }

    const centralizado = media.operacoesCentralizado ?? 0;
    const total = centralizado + (media.pedidosLegadoPiloto ?? 0);

    return total > 0 ? (centralizado / total) * 100 : null;
  };

  /** Diferença entre dois percentuais, em pontos percentuais. */
  const compararEmPontos = (atual: number | null, anterior: number | null) => {
    if (atual === null || anterior === null) {
      return null;
    }

    const diferenca = Number((atual - anterior).toFixed(1));
    const sinal = diferenca > 0 ? '+' : diferenca < 0 ? '−' : '';

    return {
      texto: `${sinal}${Math.abs(diferenca).toLocaleString('pt-BR')} p.p.`,
      sentido: diferenca > 0 ? ('alta' as const) : diferenca < 0 ? ('baixa' as const) : ('estavel' as const),
    };
  };

  const variacaoDaAdesaoDaRede = compararEmPontos(
    adesaoDaRede(ultimaSemanaCrua),
    adesaoDaRede(semanaAnteriorCrua),
  );

  const variacaoDaAdesaoDoPiloto = compararEmPontos(
    adesaoDoPiloto(ultimaSemanaCrua),
    adesaoDoPiloto(semanaAnteriorCrua),
  );

  /** As duas últimas semanas com a faixa de tempo apurada. */
  const faixasApuradas = (campo: 'percentualAte1s' | 'percentualAte3s') =>
    [...(latencias.data ?? [])]
      .filter((latencia) => latencia[campo] !== null)
      .sort((a, b) => a.semana.localeCompare(b.semana));

  const semanasAte3s = faixasApuradas('percentualAte3s');
  const abaixoDe3s = semanasAte3s.at(-1)?.percentualAte3s ?? null;
  const variacaoAbaixoDe3s = compararEmPontos(
    abaixoDe3s,
    semanasAte3s.at(-2)?.percentualAte3s ?? null,
  );

  const semanasAte1s = faixasApuradas('percentualAte1s');
  const abaixoDe1s = semanasAte1s.at(-1)?.percentualAte1s ?? null;
  const variacaoAbaixoDe1s = compararEmPontos(
    abaixoDe1s,
    semanasAte1s.at(-2)?.percentualAte1s ?? null,
  );


  const lojasOperando =
    dados.total -
    STATUS_FORA_DO_CENTRALIZADO.reduce(
      (soma, status) => soma + (dados.porStatus[status] ?? 0),
      0,
    );

  const pontosDeStatus = statusPorDia.data?.pontos ?? [];
  // Sete dias antes do último ponto; com série mais curta, o começo dela.
  const statusHaUmaSemana =
    pontosDeStatus.length === 0 ? null : (pontosDeStatus.at(-8) ?? pontosDeStatus[0]);

  const percentualOperando = (ponto: (typeof pontosDeStatus)[number] | null | undefined) => {
    if (!ponto || ponto.total === 0) {
      return null;
    }

    const fora = STATUS_FORA_DO_CENTRALIZADO.reduce(
      (soma, status) => soma + (ponto[status] ?? 0),
      0,
    );

    return ((ponto.total - fora) / ponto.total) * 100;
  };

  const variacaoDeLojasOperando = compararEmPontos(
    percentualOperando(pontosDeStatus.at(-1)),
    percentualOperando(statusHaUmaSemana),
  );

  const percentualConcluido = (ponto: (typeof pontosDeStatus)[number] | null | undefined) =>
    !ponto || ponto.total === 0 ? null : (ponto.CONCLUIDO / ponto.total) * 100;

  const variacaoDeConcluidas = compararEmPontos(
    percentualConcluido(pontosDeStatus.at(-1)),
    percentualConcluido(statusHaUmaSemana),
  );

  const concluidasHoje = pontosDeStatus.at(-1)?.CONCLUIDO ?? null;
  const concluidasHaUmaSemana = statusHaUmaSemana?.CONCLUIDO ?? null;

  const variacaoSemanal =
    concluidasHoje === null || concluidasHaUmaSemana === null
      ? null
      : concluidasHoje - concluidasHaUmaSemana;

  const crescimentoSemanal = (() => {
    // Semana parada não vira texto: o cartão fica só com a descrição.
    if (variacaoSemanal === null || variacaoSemanal === 0) {
      return null;
    }

    const sinal = variacaoSemanal > 0 ? '+' : '−';
    const absoluto = Math.abs(variacaoSemanal);

    if (!concluidasHaUmaSemana) {
      return `${sinal}${absoluto} ${absoluto === 1 ? 'loja' : 'lojas'} na semana`;
    }

    const percentual = Number(((absoluto / concluidasHaUmaSemana) * 100).toFixed(1));

    return `${sinal}${percentual.toLocaleString('pt-BR')}% na semana`;
  })();

  return (
    <>
      <div className="acoes-topo">
        <button className="aba" onClick={() => setLancamentosAbertos(true)}>
          Lançamentos por semana{semanasLancadas ? ` (${semanasLancadas})` : ''}
        </button>
        <button className="aba" onClick={() => setMelhoriasAbertas(true)}>
          Melhorias
        </button>
      </div>

      <h2 className="titulo-secao">Evolução das lojas</h2>

      <div className="grade-secao">
        <CartaoGrafico
          titulo="Lojas Operando no Centralizado"
          subtitulo="Lojas que já entraram no rollout, fora as não iniciadas e bloqueadas"
        >
          <RoscaProporcao
            fatias={[
              {
                chave: 'operando',
                rotulo: 'Operando',
                icone: ICONE_STATUS.EM_OPERACAO,
                valor: lojasOperando,
                cor: 'var(--serie-1)',
              },
              {
                chave: 'fora',
                rotulo: 'Não iniciadas ou bloqueadas',
                valor: dados.total - lojasOperando,
                cor: 'var(--neutro)',
              },
            ]}
            destaque={
              dados.total === 0
                ? '—'
                : `${Number(((lojasOperando / dados.total) * 100).toFixed(1)).toLocaleString('pt-BR')}%`
            }
            legendaDoDestaque="da rede"
            variacao={variacaoDeLojasOperando}
            unidade="Lojas"
            vazio="Nenhuma loja cadastrada."
          />
        </CartaoGrafico>

        <CartaoGrafico titulo="Situação das lojas" subtitulo="Distribuição da base por status">
          <GraficoStatus resumo={dados} />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Lojas concluídas"
          subtitulo={
            crescimentoSemanal
              ? `Lojas operando só com o CliQQ Centralizado há mais de uma semana · ${crescimentoSemanal}`
              : 'Lojas operando só com o CliQQ Centralizado há mais de uma semana'
          }
        >
          <RoscaProporcao
            fatias={[
              {
                chave: 'desligado',
                rotulo: 'Legado desligado',
                icone: ICONE_STATUS.CONCLUIDO,
                valor: dados.concluidas,
                cor: COR_STATUS.CONCLUIDO,
              },
              {
                chave: 'ativo',
                rotulo: 'Legado ainda ativo',
                valor: dados.total - dados.concluidas,
                cor: 'var(--neutro)',
              },
            ]}
            destaque={`${dados.percentualConcluido.toLocaleString('pt-BR')}%`}
            legendaDoDestaque="concluído"
            variacao={variacaoDeConcluidas}
            unidade="Lojas"
            vazio="Nenhuma loja cadastrada."
          />
        </CartaoGrafico>
      </div>

      <h2 className="titulo-secao">Adesão</h2>

      <div className="grade-secao">
        <CartaoGrafico
          titulo="Adesão da rede na última semana"
          subtitulo="Operações no centralizado sobre o total da rede"
        >
          <RoscaProporcao
            fatias={[
              {
                chave: 'centralizado',
                rotulo: 'CliQQ Centralizado',
                valor: ultimaSemanaCrua?.operacoesCentralizado ?? 0,
                cor: 'var(--serie-1)',
              },
              {
                chave: 'legado',
                rotulo: 'Legado da rede',
                valor: ultimaSemanaCrua?.operacoesLegado ?? 0,
                cor: 'var(--neutro)',
              },
            ]}
            destaque={formatarAdesao(
              ultimaSemanaCrua?.operacoesCentralizado ?? 0,
              ultimaSemanaCrua?.operacoesLegado ?? 0,
            )}
            legendaDoDestaque="no centralizado"
            variacao={variacaoDaAdesaoDaRede}
            unidade="Operações"
            vazio="Informe as operações do legado e do centralizado em “Lançamentos por semana”."
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Adesão do piloto na última semana"
          subtitulo="Operações no centralizado sobre o total das lojas do piloto"
        >
          <RoscaProporcao
            fatias={[
              {
                chave: 'centralizado',
                rotulo: 'CliQQ Centralizado',
                valor: ultimaSemanaCrua?.operacoesCentralizado ?? 0,
                cor: 'var(--serie-1)',
              },
              {
                chave: 'legado',
                rotulo: 'Legado no piloto',
                valor: ultimaSemanaCrua?.pedidosLegadoPiloto ?? 0,
                cor: 'var(--neutro)',
              },
            ]}
            destaque={formatarAdesao(
              ultimaSemanaCrua?.operacoesCentralizado ?? 0,
              ultimaSemanaCrua?.pedidosLegadoPiloto ?? 0,
            )}
            legendaDoDestaque="no centralizado"
            variacao={variacaoDaAdesaoDoPiloto}
            unidade="Operações"
            vazio="Informe o total de pedidos do legado piloto em “Lançamentos por semana”."
          />
        </CartaoGrafico>

      </div>

      <h2 className="titulo-secao">Performance e Erros</h2>

      <div className="grade-secao">
        <CartaoGrafico
          titulo="Requisições abaixo de 1s"
          subtitulo="Tempo de resposta na última semana apurada"
        >
          <RoscaProporcao
            fatias={[
              {
                chave: 'abaixo',
                rotulo: 'Abaixo de 1s',
                valor: abaixoDe1s ?? 0,
                cor: 'var(--status-bom)',
              },
              {
                chave: 'acima',
                rotulo: 'A partir de 1s',
                valor: abaixoDe1s === null ? 0 : Number((100 - abaixoDe1s).toFixed(1)),
                cor: 'var(--neutro)',
              },
            ]}
            destaque={abaixoDe1s === null ? '—' : `${abaixoDe1s.toLocaleString('pt-BR')}%`}
            legendaDoDestaque="abaixo de 1s"
            variacao={variacaoAbaixoDe1s}
            unidade="% das requisições"
            vazio="Informe o % menor que 1s em “Lançamentos por semana”."
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Requisições abaixo de 3s"
          subtitulo="Tempo de resposta na última semana apurada"
        >
          <RoscaProporcao
            fatias={[
              {
                chave: 'abaixo',
                rotulo: 'Abaixo de 3s',
                valor: abaixoDe3s ?? 0,
                cor: 'var(--status-bom)',
              },
              {
                chave: 'acima',
                rotulo: 'Acima de 3s',
                valor: abaixoDe3s === null ? 0 : Number((100 - abaixoDe3s).toFixed(1)),
                cor: 'var(--status-critico)',
              },
            ]}
            destaque={abaixoDe3s === null ? '—' : `${abaixoDe3s.toLocaleString('pt-BR')}%`}
            legendaDoDestaque="abaixo de 3s"
            variacao={variacaoAbaixoDe3s}
            unidade="% das requisições"
            vazio="Informe o % menor que 3s em “Lançamentos por semana”."
          />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Bugs Reportados pelas Lojas"
          subtitulo="Bugs ainda abertos ao fim de cada semana, empilhados da criticidade alta para a baixa"
          acoes={
            <button
              className="aba"
              onClick={() => setDescricoesAbertas(true)}
              disabled={semanasComDescricao === 0}
            >
              Descrições{semanasComDescricao ? ` (${semanasComDescricao})` : ''}
            </button>
          }
        >
          <GraficoBugsPorCriticidade />
        </CartaoGrafico>
      </div>

      <h2 className="titulo-secao">Analítico</h2>

      <div className="grade-graficos">
        <CartaoGrafico
          titulo="Performance / Tempo de Resposta"
          subtitulo="% das requisições por faixa de tempo (eixo à esquerda) e total de transações da semana (barra, eixo à direita)"
        >
          <GraficoLatenciaSemanal />
        </CartaoGrafico>

        <CartaoGrafico titulo="Média de operações por dia">
          <GraficoMediaDiaria />
        </CartaoGrafico>

        <CartaoGrafico
          largo
          titulo="Próximas Melhorias"
          subtitulo="O que está previsto para subir e o que entrou em produção nos últimos 7 dias"
          acoes={
            <button className="aba" onClick={() => setMelhoriasAbertas(true)}>
              Cadastrar
            </button>
          }
        >
          <ListaProximasMelhorias />
        </CartaoGrafico>

        <CartaoGrafico
          largo
          titulo="Status dia a dia"
          subtitulo="Quantidade de lojas em cada status ao longo do tempo — clique na legenda para ocultar"
        >
          {statusPorDia.data ? (
            <GraficoStatusPorDia dados={statusPorDia.data} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Adesão ao CliQQ Centralizado (Rede)"
          subtitulo="% das operações da semana que rodaram no centralizado, sobre o total da rede (legado + centralizado)"
        >
          <GraficoAdesaoCentralizado />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Adesão ao CliQQ Centralizado (Lojas Piloto)"
          subtitulo="Centralizado x realizado pelas lojas do piloto; a linha traz o % entre os dois (eixo à direita)"
        >
          <GraficoMediaSemanal />
        </CartaoGrafico>

        <CartaoGrafico titulo="Por UF" subtitulo="Distribuição de status em cada estado">
          {porUf.data ? (
            <GraficoGrupos grupos={porUf.data} larguraRotulo={104} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>


        <CartaoGrafico titulo="Por onda" subtitulo={REGRA_DAS_ONDAS}>
          {porOnda.data ? (
            <GraficoGrupos grupos={porOnda.data} larguraRotulo={104} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>
      </div>

      {lancamentosAbertos ? (
        <ModalLancamentosSemanais aoFechar={() => setLancamentosAbertos(false)} />
      ) : null}

      {melhoriasAbertas ? <ModalMelhorias aoFechar={() => setMelhoriasAbertas(false)} /> : null}

      {descricoesAbertas ? (
        <ModalDescricoesDeBugs
          semanas={medias.data ?? []}
          aoFechar={() => setDescricoesAbertas(false)}
        />
      ) : null}
    </>
  );
}
