import { usePriorizacao, useSalvarResposta } from '../api/hooks';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { CartaoKpi } from '../componentes/CartaoKpi';
import { FormularioDemanda } from '../componentes/FormularioDemanda';
import { GraficoPriorizacao } from '../componentes/GraficoPriorizacao';
import { TabelaPriorizacao } from '../componentes/TabelaPriorizacao';
import {
  CORTE_GANHO_RAPIDO,
  PERGUNTAS,
  PONTUACAO_VALOR_MAXIMA,
  PONTUACAO_VALOR_MINIMA,
  ehGanhoRapido,
  ordenarPorPrioridade,
} from '../dominio/priorizacao';

export function Priorizacao() {
  const priorizacao = usePriorizacao();
  const salvar = useSalvarResposta();

  const demandas = priorizacao.data ?? [];
  const completas = demandas.filter((demanda) => demanda.completa);
  const pendentes = demandas.length - completas.length;
  const ganhosRapidos = completas.filter(ehGanhoRapido).length;
  const diasEstimados = completas.reduce((soma, demanda) => soma + (demanda.dias ?? 0), 0);

  return (
    <>
      <div className="grade-kpi">
        <CartaoKpi rotulo="Demandas no backlog" valor={demandas.length} apoio="lista mockada" />
        <CartaoKpi
          rotulo="Priorizadas"
          valor={completas.length}
          apoio={`${pendentes} sem as ${PERGUNTAS.length} respostas`}
        />
        <CartaoKpi
          rotulo="Ganhos rápidos"
          valor={ganhosRapidos}
          apoio={`valor ≥ ${CORTE_GANHO_RAPIDO} e alguns dias de esforço`}
        />
        <CartaoKpi
          rotulo="Esforço priorizado"
          valor={`${diasEstimados} dias`}
          apoio="soma das demandas já priorizadas"
        />
      </div>

      <div className="grade-graficos">
        <CartaoGrafico
          largo
          titulo="Matriz de priorização"
          subtitulo={`Eixo Y: soma das 4 primeiras perguntas (${PONTUACAO_VALOR_MINIMA} a ${PONTUACAO_VALOR_MAXIMA}). Eixo X: tempo estimado de desenvolvimento. Quanto mais alto e mais à esquerda, maior a prioridade. Demandas com a mesma nota são afastadas na horizontal para não se sobreporem.`}
        >
          {priorizacao.isLoading ? <p className="carregando">Carregando…</p> : null}
          {!priorizacao.isLoading && completas.length === 0 ? (
            <p className="carregando">
              Nenhuma demanda com as {PERGUNTAS.length} perguntas respondidas ainda.
            </p>
          ) : null}
          {completas.length > 0 ? <GraficoPriorizacao demandas={completas} /> : null}
        </CartaoGrafico>

        <CartaoGrafico
          largo
          titulo="Ranking"
          subtitulo="Score = soma das 5 perguntas (20 a 100). Demandas sem todas as respostas ficam no fim e fora do gráfico."
        >
          {demandas.length > 0 ? (
            <TabelaPriorizacao demandas={demandas} />
          ) : (
            <p className="carregando">Carregando…</p>
          )}
        </CartaoGrafico>
      </div>

      <section className="lista-demandas">
        <h2>Backlog</h2>
        <p className="subtitulo">
          Responda as {PERGUNTAS.length} perguntas de cada demanda. A resposta é salva na hora e
          pode ser trocada a qualquer momento — vale sempre a última.
        </p>

        {salvar.isError ? <p className="erro">Não foi possível salvar a resposta.</p> : null}

        {ordenarPorPrioridade(demandas).map((demanda) => (
          <FormularioDemanda
            key={demanda.id}
            demanda={demanda}
            salvando={salvar.isPending && salvar.variables?.demandaId === demanda.id}
            aoResponder={(campo, pontos) =>
              salvar.mutate({ demandaId: demanda.id, resposta: { [campo]: pontos } })
            }
          />
        ))}
      </section>
    </>
  );
}
