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
import { ModalDescricoesDeBugs } from '../componentes/ModalDescricoesDeBugs';
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

  const ultimaLatencia = [...(latencias.data ?? [])]
    .filter((latencia) => latencia.percentualAte3s !== null)
    .sort((a, b) => a.semana.localeCompare(b.semana))
    .at(-1);

  const abaixoDe3s = ultimaLatencia?.percentualAte3s ?? null;

  const ultimaLatenciaAte1s = [...(latencias.data ?? [])]
    .filter((latencia) => latencia.percentualAte1s !== null)
    .sort((a, b) => a.semana.localeCompare(b.semana))
    .at(-1);

  const abaixoDe1s = ultimaLatenciaAte1s?.percentualAte1s ?? null;


  const lojasOperando =
    dados.total -
    STATUS_FORA_DO_CENTRALIZADO.reduce(
      (soma, status) => soma + (dados.porStatus[status] ?? 0),
      0,
    );

  const pontosDeStatus = statusPorDia.data?.pontos ?? [];
  const concluidasHoje = pontosDeStatus.at(-1)?.CONCLUIDO ?? null;
  // Sete dias antes do último ponto; com série mais curta, o começo dela.
  const concluidasHaUmaSemana =
    pontosDeStatus.length === 0
      ? null
      : (pontosDeStatus.at(-8) ?? pontosDeStatus[0]).CONCLUIDO;

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
      </div>

      <div className="grade-roscas">
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
            unidade="Lojas"
            vazio="Nenhuma loja cadastrada."
          />
        </CartaoGrafico>

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
            unidade="Operações"
            vazio="Informe o total de pedidos do legado piloto em “Lançamentos por semana”."
          />
        </CartaoGrafico>

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
            unidade="% das requisições"
            vazio="Informe o % menor que 1s em “Lançamentos por semana”."
          />
        </CartaoGrafico>

      </div>

      <div className="grade-graficos">
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

      {descricoesAbertas ? (
        <ModalDescricoesDeBugs
          semanas={medias.data ?? []}
          aoFechar={() => setDescricoesAbertas(false)}
        />
      ) : null}
    </>
  );
}
