import { useState } from 'react';
import {
  useLatenciasSemanais,
  useMediasSemanais,
  useOndas,
  useResumo,
  useStatusPorDia,
  useUf,
} from '../api/hooks';
import { REGRA_DAS_ONDAS } from '../dominio/ondas';
import { STATUS_EM_IMPLANTACAO } from '../tema/cores';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { CartaoKpi } from '../componentes/CartaoKpi';
import { GraficoGrupos } from '../componentes/GraficoGrupos';
import { GraficoStatus } from '../componentes/GraficoStatus';
import { GraficoStatusPorDia } from '../componentes/GraficoStatusPorDia';
import { GraficoLatenciaSemanal } from '../componentes/GraficoLatenciaSemanal';
import { GraficoMediaSemanal } from '../componentes/GraficoMediaSemanal';
import { ModalLancamentosSemanais } from '../componentes/ModalLancamentosSemanais';

export function Dashboard() {
  const resumo = useResumo();
  const porUf = useUf();
  const porOnda = useOndas();
  const statusPorDia = useStatusPorDia();
  const medias = useMediasSemanais();
  const latencias = useLatenciasSemanais();
  const [lancamentosAbertos, setLancamentosAbertos] = useState(false);

  if (resumo.isLoading || !resumo.data) {
    return <p className="carregando">Carregando indicadores…</p>;
  }

  const dados = resumo.data;

  const semanasLancadas = new Set([
    ...(medias.data ?? []).map((media) => media.semana),
    ...(latencias.data ?? []).map((latencia) => latencia.semana),
  ]).size;

  return (
    <>
      <div className="acoes-topo">
        <button className="aba" onClick={() => setLancamentosAbertos(true)}>
          Lançamentos por semana{semanasLancadas ? ` (${semanasLancadas})` : ''}
        </button>
      </div>

      <div className="grade-kpi">
        <CartaoKpi
          rotulo="Rollout concluído"
          valor={`${dados.percentualConcluido}%`}
          apoio={`${dados.concluidas} de ${dados.total} lojas`}
        />
        <CartaoKpi
          rotulo="Operações cobertas"
          valor={`${dados.percentualOperacoesCobertas}%`}
          apoio={`${dados.operacoesConcluidas} de ${dados.operacoesTotais} operações/dia`}
        />
        <CartaoKpi
          rotulo="Em implantação"
          valor={STATUS_EM_IMPLANTACAO.reduce(
            (soma, status) => soma + (dados.porStatus[status] ?? 0),
            0,
          )}
          apoio="treinamento, adaptação ou operação"
        />
      </div>

      <div className="grade-graficos">
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
          titulo="Média de operações por semana"
          subtitulo="Média diária de operações apurada em cada semana"
        >
          <GraficoMediaSemanal />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Latência das requisições"
          subtitulo="P50, P75, P95 e P99 por semana, em milissegundos"
        >
          <GraficoLatenciaSemanal />
        </CartaoGrafico>

        <CartaoGrafico titulo="Situação das lojas" subtitulo="Distribuição da base por status">
          <GraficoStatus resumo={dados} />
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
    </>
  );
}
