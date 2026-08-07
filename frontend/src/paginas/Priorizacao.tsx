import { useState } from 'react';
import { mensagemDoErro } from '../api/cliente';
import { usePriorizacao, useSalvarResposta, useSincronizarPriorizacao } from '../api/hooks';
import { CartaoGrafico } from '../componentes/CartaoGrafico';
import { CartaoKpi } from '../componentes/CartaoKpi';
import { GraficoPriorizacao } from '../componentes/GraficoPriorizacao';
import { ModalDemanda } from '../componentes/ModalDemanda';
import { TabelaPriorizacao } from '../componentes/TabelaPriorizacao';
import {
  CORTE_GANHO_RAPIDO,
  DIRECAO_INICIAL,
  PERGUNTAS,
  PONTUACAO_VALOR_MAXIMA,
  PONTUACAO_VALOR_MINIMA,
  ROTULO_TIPO,
  ehGanhoRapido,
  posicoesDoRanking,
  proximaPendente,
  type ColunaOrdenavel,
  type OrdenacaoRanking,
} from '../dominio/priorizacao';

export function Priorizacao() {
  const priorizacao = usePriorizacao();
  const salvar = useSalvarResposta();
  const sincronizar = useSincronizarPriorizacao();
  const [somentePendentes, setSomentePendentes] = useState(false);
  const [demandaAberta, setDemandaAberta] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [estadosOcultos, setEstadosOcultos] = useState<string[]>([]);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoRanking | null>(null);

  const demandas = priorizacao.data ?? [];
  const completas = demandas.filter((demanda) => demanda.completa);
  const pendentes = demandas.filter((demanda) => !demanda.completa);
  const ganhosRapidos = completas.filter(ehGanhoRapido).length;
  const diasEstimados = completas.reduce((soma, demanda) => soma + (demanda.dias ?? 0), 0);

  const tipos = [...new Set(demandas.map((demanda) => demanda.tipo))].sort();
  const estados = [...new Set(demandas.map((demanda) => demanda.estado ?? ''))].sort();

  const antesDoEstado = demandas.filter(
    (demanda) =>
      (!somentePendentes || !demanda.completa) && (!filtroTipo || demanda.tipo === filtroTipo),
  );

  const contagemPorEstado = new Map<string, number>();

  for (const demanda of antesDoEstado) {
    const estado = demanda.estado ?? '';
    contagemPorEstado.set(estado, (contagemPorEstado.get(estado) ?? 0) + 1);
  }

  const listadas = antesDoEstado.filter(
    (demanda) => !estadosOcultos.includes(demanda.estado ?? ''),
  );

  const alternarEstado = (estado: string) =>
    setEstadosOcultos((ocultos) =>
      ocultos.includes(estado)
        ? ocultos.filter((nome) => nome !== estado)
        : [...ocultos, estado],
    );

  const posicoes = posicoesDoRanking(demandas);
  const aberta = demandas.find((demanda) => demanda.id === demandaAberta) ?? null;
  const proxima = aberta ? proximaPendente(demandas, aberta.id) : null;
  const resumo = sincronizar.data;

  const alternarOrdenacao = (coluna: ColunaOrdenavel) =>
    setOrdenacao((atual) =>
      atual?.coluna === coluna
        ? { coluna, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { coluna, direcao: DIRECAO_INICIAL[coluna] },
    );

  return (
    <>
      <div className="barra-sincronizacao">
        <div>
          <button
            type="button"
            className="aba primario"
            disabled={sincronizar.isPending}
            onClick={() => sincronizar.mutate()}
          >
            {sincronizar.isPending ? 'Sincronizando…' : 'Atualizar do GitLab'}
          </button>
          {resumo && !sincronizar.isPending ? (
            <span className="aviso-sincronizacao">
              {resumo.novas} novas · {resumo.atualizadas} atualizadas · {resumo.sairam} saíram do
              filtro
            </span>
          ) : null}
        </div>
        <p className="subtitulo">
          Issues abertas de <code>mercantil/mercantil</code> com <code>system::cliqq-centralizado</code>{' '}
          e <code>type::crm</code> ou <code>type::melhoria</code>
        </p>
      </div>

      {sincronizar.isError ? <p className="erro">{mensagemDoErro(sincronizar.error)}</p> : null}
      {salvar.isError ? <p className="erro">{mensagemDoErro(salvar.error)}</p> : null}

      <div className="grade-kpi">
        <CartaoKpi
          rotulo="Demandas no backlog"
          valor={demandas.length}
          apoio="issues abertas no filtro"
        />
        <CartaoKpi
          rotulo="Priorizadas"
          valor={completas.length}
          apoio={`${pendentes.length} sem as ${PERGUNTAS.length} respostas`}
        />
        <CartaoKpi
          rotulo="Ganhos rápidos"
          valor={ganhosRapidos}
          apoio={`valor ≥ ${CORTE_GANHO_RAPIDO} e até 2 dias de esforço`}
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
          subtitulo="Score = soma das 5 perguntas (20 a 100). Clique no score para abrir as perguntas. Demandas sem todas as respostas ficam no fim e fora do gráfico."
          acoes={
            <button
              type="button"
              className="aba"
              aria-pressed={somentePendentes}
              onClick={() => setSomentePendentes((ligado) => !ligado)}
            >
              {somentePendentes ? `Só pendentes (${pendentes.length})` : `Todas (${demandas.length})`}
            </button>
          }
        >
          {demandas.length > 0 ? (
            <div className="filtros">
              <select
                value={filtroTipo}
                onChange={(evento) => setFiltroTipo(evento.target.value)}
                aria-label="Filtrar por tipo"
              >
                <option value="">Todos os tipos</option>
                {tipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ROTULO_TIPO[tipo] ?? tipo}
                  </option>
                ))}
              </select>
              <span className="aviso-sincronizacao">
                {listadas.length} de {demandas.length}
              </span>
            </div>
          ) : null}

          {demandas.length > 0 ? (
            <fieldset className="filtro-estados">
              <legend>Estados exibidos</legend>
              <div className="opcoes">
                {estados.map((estado) => {
                  const visivel = !estadosOcultos.includes(estado);

                  return (
                    <button
                      key={estado}
                      type="button"
                      className={visivel ? 'opcao opcao-marcada' : 'opcao'}
                      aria-pressed={visivel}
                      onClick={() => alternarEstado(estado)}
                    >
                      <span>{estado || 'sem estado'}</span>
                      <span className="opcao-pontos">{contagemPorEstado.get(estado) ?? 0}</span>
                    </button>
                  );
                })}
                {estadosOcultos.length > 0 ? (
                  <button type="button" className="ligacao" onClick={() => setEstadosOcultos([])}>
                    mostrar todos
                  </button>
                ) : null}
              </div>
            </fieldset>
          ) : null}

          {priorizacao.isLoading ? <p className="carregando">Carregando…</p> : null}
          {!priorizacao.isLoading && demandas.length === 0 ? (
            <p className="carregando">
              Nenhuma demanda carregada. Clique em “Atualizar do GitLab” para buscar as issues.
            </p>
          ) : null}
          {demandas.length > 0 && listadas.length === 0 ? (
            <p className="carregando">Nenhuma demanda com esse filtro.</p>
          ) : null}
          {listadas.length > 0 ? (
            <TabelaPriorizacao
              demandas={listadas}
              posicoes={posicoes}
              ordenacao={ordenacao}
              salvandoId={salvar.isPending ? (salvar.variables?.demandaId ?? null) : null}
              aoOrdenar={alternarOrdenacao}
              aoVoltarParaORanking={() => setOrdenacao(null)}
              aoAlterarEsforco={(demandaId, pontos) =>
                salvar.mutate({ demandaId, resposta: { esforco: pontos } })
              }
              aoAbrir={setDemandaAberta}
            />
          ) : null}
        </CartaoGrafico>
      </div>

      {aberta ? (
        <ModalDemanda
          demanda={aberta}
          salvando={salvar.isPending && salvar.variables?.demandaId === aberta.id}
          temProximaPendente={proxima !== null}
          aoResponder={(campo, pontos) =>
            salvar.mutate({ demandaId: aberta.id, resposta: { [campo]: pontos } })
          }
          aoIrParaProximaPendente={() => setDemandaAberta(proxima)}
          aoFechar={() => setDemandaAberta(null)}
        />
      ) : null}
    </>
  );
}
