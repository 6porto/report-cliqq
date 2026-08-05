import { useCoberturaOndas, useDistribuicaoHoraria, useProjecao, useResumo } from '../api/hooks';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { CartaoKpi } from '../componentes/CartaoKpi';
import { CriterioDasOndas } from '../componentes/CriterioDasOndas';
import { EtapasDoPiloto } from '../componentes/EtapasDoPiloto';
import { DURACAO_DO_PILOTO } from '../dominio/etapas-do-piloto';
import {
  ACRESCIMO_PEDIDOS_NAO_CONCLUIDOS,
  CHAMADAS_POR_OPERACAO,
  requisicoesDiarias,
} from '../dominio/requisicoes';
import { GraficoCoberturaOndas } from '../componentes/GraficoCoberturaOndas';
import { GraficoDistribuicaoHoraria } from '../componentes/GraficoDistribuicaoHoraria';
import { GraficoProjecao } from '../componentes/GraficoProjecao';

const CRESCIMENTOS = [10, 20, 30, 40, 50];

export function Plano() {
  const resumo = useResumo();
  const distribuicaoHoraria = useDistribuicaoHoraria();
  const coberturaOndas = useCoberturaOndas();
  const projecoes = [
    useProjecao(CRESCIMENTOS[0]),
    useProjecao(CRESCIMENTOS[1]),
    useProjecao(CRESCIMENTOS[2]),
    useProjecao(CRESCIMENTOS[3]),
    useProjecao(CRESCIMENTOS[4]),
  ];

  const cenarios = projecoes
    .map((consulta, indice) =>
      consulta.data
        ? {
            projecao: consulta.data,
            rotulo: `+${CRESCIMENTOS[indice]}%/semana`,
            cor: `var(--calor-${CRESCIMENTOS.length - indice})`,
          }
        : null,
    )
    .filter((cenario) => cenario !== null);

  return (
    <>
      <div className="grade-kpi">
        <CartaoKpi
          rotulo="Total de lojas"
          valor={resumo.data ? resumo.data.total.toLocaleString('pt-BR') : '—'}
          apoio="rede toda"
        />
        <CartaoKpi
          rotulo="Total de operações por dia"
          valor={resumo.data ? resumo.data.operacoesTotais.toLocaleString('pt-BR') : '—'}
          apoio="média dos últimos 90 dias"
        />
        <CartaoKpi
          rotulo="Requisições por dia"
          valor={
            resumo.data ? requisicoesDiarias(resumo.data.operacoesTotais).toLocaleString('pt-BR') : '—'
          }
          apoio={`${CHAMADAS_POR_OPERACAO} chamadas por operação + ${ACRESCIMO_PEDIDOS_NAO_CONCLUIDOS * 100}% de pedidos não concluídos`}
        />
      </div>

      <div className="grade-graficos">
        <CartaoGrafico
          largo
          titulo="Como as lojas foram distribuídas nas ondas"
          subtitulo="Critério: média de operações/dia dos últimos 90 dias de cada loja. Ordena a rede da maior para a menor movimentação, para que as primeiras ondas cubram o máximo de operações com o mínimo de lojas."
        >
          {coberturaOndas.data ? (
            <CriterioDasOndas ondas={coberturaOndas.data} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Cobertura de operações por onda"
          subtitulo="% das operações da rede que passam a rodar no CliQQ ao fim de cada onda (acumulado)"
        >
          {coberturaOndas.data ? (
            <GraficoCoberturaOndas ondas={coberturaOndas.data} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Distribuição das operações no dia"
          subtitulo={
            distribuicaoHoraria.data
              ? `Operações/hora com a rede toda no CliQQ (rótulo = operações por minuto) · pico às ${distribuicaoHoraria.data.horaDePico} com ${distribuicaoHoraria.data.operacoesNoPico.toLocaleString('pt-BR')} operações (${distribuicaoHoraria.data.operacoesPorMinutoNoPico.toLocaleString('pt-BR')}/min) · percentuais normalizados (a curva informada soma ${distribuicaoHoraria.data.percentualInformado}%)`
              : 'Distribuição do volume diário por horário (dias úteis, BRT)'
          }
        >
          {distribuicaoHoraria.data ? (
            <GraficoDistribuicaoHoraria distribuicao={distribuicaoHoraria.data} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>

        <CartaoGrafico
          largo
          titulo="Status da loja durante o piloto"
          subtitulo={`Cada loja passa pelos três status na ordem abaixo, em ${DURACAO_DO_PILOTO} dias no total`}
        >
          <EtapasDoPiloto />
        </CartaoGrafico>

        <CartaoGrafico
          largo
          titulo="Projeção de crescimento"
          subtitulo={`Operações/dia acumuladas no CliQQ, crescendo ${CRESCIMENTOS.join(
            '%, ',
          )}% por semana desde o início`}
        >
          {cenarios.length === CRESCIMENTOS.length ? (
            <GraficoProjecao cenarios={cenarios} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>
      </div>
    </>
  );
}
