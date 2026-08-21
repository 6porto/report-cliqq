import { useState } from 'react';
import { useEvolucao, useOndas, useResumo, useStatusPorDia, useUf } from '../api/hooks';
import { REGRA_DAS_ONDAS } from '../dominio/ondas';
import { STATUS_EM_IMPLANTACAO } from '../tema/cores';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { CartaoKpi } from '../componentes/CartaoKpi';
import { GraficoEvolucao } from '../componentes/GraficoEvolucao';
import { GraficoGrupos } from '../componentes/GraficoGrupos';
import { GraficoStatus } from '../componentes/GraficoStatus';
import { GraficoStatusPorDia } from '../componentes/GraficoStatusPorDia';

export function Dashboard() {
  const [granularidade, setGranularidade] = useState<'semana' | 'mes'>('semana');
  const resumo = useResumo();
  const evolucao = useEvolucao(granularidade);
  const porUf = useUf();
  const porOnda = useOndas();
  const statusPorDia = useStatusPorDia();

  if (resumo.isLoading || !resumo.data) {
    return <p className="carregando">Carregando indicadores…</p>;
  }

  const dados = resumo.data;

  return (
    <>
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
        <CartaoKpi
          rotulo="Concluídas (7 dias)"
          valor={dados.concluidasUltimos7Dias}
          apoio="ritmo da última semana"
        />
        <CartaoKpi
          rotulo="Atrasadas"
          valor={dados.atrasadas}
          apoio="passaram da data prevista"
        />
        <CartaoKpi
          rotulo="Bloqueadas"
          valor={dados.porStatus.BLOQUEADO}
          apoio="dependem de tratativa"
        />
      </div>

      <div className="grade-graficos">
        <CartaoGrafico
          titulo="Evolução do rollout"
          subtitulo="Lojas concluídas acumuladas x meta"
          acoes={
            <select
              aria-label="Granularidade"
              value={granularidade}
              onChange={(evento) => setGranularidade(evento.target.value as 'semana' | 'mes')}
            >
              <option value="semana">Semanal</option>
              <option value="mes">Mensal</option>
            </select>
          }
        >
          {evolucao.data ? (
            <GraficoEvolucao dados={evolucao.data} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Status dia a dia"
          subtitulo="Quantidade de lojas em cada status ao longo do tempo — clique na legenda para ocultar"
        >
          {statusPorDia.data ? (
            <GraficoStatusPorDia dados={statusPorDia.data} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>

        <CartaoGrafico titulo="Situação das lojas" subtitulo={`Base de ${dados.total} lojas`}>
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
    </>
  );
}
