import {
  CartesianGrid,
  LabelList,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DemandaPriorizada } from '../api/tipos';
import {
  POSICOES_DE_ESFORCO,
  PONTUACAO_VALOR_MAXIMA,
  PONTUACAO_VALOR_MINIMA,
} from '../dominio/priorizacao';
import { Dica } from './Dica';

interface Props {
  demandas: DemandaPriorizada[];
}

interface Ponto {
  x: number;
  y: number;
  id: number;
  descricao: string;
  score: number;
  rotuloEsforco: string;
  pontuacaoEsforco: number;
}

const COR_PONTO = 'var(--serie-1)';
const FOLGA_Y = 5;
const AFASTAMENTO_X = 0.16;

/**
 * Demandas com a mesma nota caem no mesmo pixel. O deslocamento acontece só no eixo X,
 * que é categórico — assim nenhum ponto mente sobre a pontuação de valor.
 */
function espalhar(demandas: DemandaPriorizada[]): Ponto[] {
  const grupos = new Map<string, DemandaPriorizada[]>();

  for (const demanda of demandas) {
    const chave = `${demanda.posicaoEsforco}|${demanda.pontuacaoValor}`;
    const grupo = grupos.get(chave);

    if (grupo) {
      grupo.push(demanda);
    } else {
      grupos.set(chave, [demanda]);
    }
  }

  return [...grupos.values()].flatMap((grupo) =>
    grupo.map((demanda, indice) => ({
      x: (demanda.posicaoEsforco ?? 0) + (indice - (grupo.length - 1) / 2) * AFASTAMENTO_X,
      y: demanda.pontuacaoValor ?? 0,
      id: demanda.id,
      descricao: demanda.descricao,
      score: demanda.score ?? 0,
      rotuloEsforco: demanda.rotuloEsforco ?? '',
      pontuacaoEsforco: demanda.pontuacaoEsforco ?? 0,
    })),
  );
}

export function GraficoPriorizacao({ demandas }: Props) {
  const pontos = espalhar(demandas);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 16, right: 40, bottom: 24, left: -6 }}>
        <defs>
          <linearGradient id="gradiente-prioridade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={COR_PONTO} stopOpacity={0.22} />
            <stop offset="60%" stopColor={COR_PONTO} stopOpacity={0.06} />
            <stop offset="100%" stopColor={COR_PONTO} stopOpacity={0} />
          </linearGradient>
        </defs>

        <ReferenceArea
          x1={-0.5}
          x2={POSICOES_DE_ESFORCO.length - 0.5}
          y1={PONTUACAO_VALOR_MINIMA - FOLGA_Y}
          y2={PONTUACAO_VALOR_MAXIMA + FOLGA_Y}
          fill="url(#gradiente-prioridade)"
          fillOpacity={1}
          stroke="none"
        />

        <CartesianGrid stroke="var(--grade)" />

        <XAxis
          type="number"
          dataKey="x"
          domain={[-0.5, POSICOES_DE_ESFORCO.length - 0.5]}
          ticks={POSICOES_DE_ESFORCO.map((_, indice) => indice)}
          tickFormatter={(valor: number) => POSICOES_DE_ESFORCO[valor] ?? ''}
          tick={{ fill: 'var(--tinta-secundaria)', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--linha-base)' }}
          label={{
            value: 'Tempo estimado de desenvolvimento',
            position: 'insideBottom',
            offset: -16,
            fill: 'var(--tinta-mutada)',
            fontSize: 11,
          }}
        />

        <YAxis
          type="number"
          dataKey="y"
          domain={[PONTUACAO_VALOR_MINIMA - FOLGA_Y, PONTUACAO_VALOR_MAXIMA + FOLGA_Y]}
          ticks={[20, 30, 40, 50, 60, 70, 80]}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={52}
          label={{
            value: 'Valor',
            angle: -90,
            position: 'insideLeft',
            offset: 18,
            fill: 'var(--tinta-mutada)',
            fontSize: 11,
          }}
        />

        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: 'var(--linha-base)' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const ponto = payload[0].payload as Ponto;

            return (
              <Dica
                titulo={`#${ponto.id} · ${ponto.descricao}`}
                itens={[
                  { nome: 'Valor (4 perguntas)', valor: ponto.y, cor: COR_PONTO },
                  { nome: 'Esforço', valor: `${ponto.rotuloEsforco} (${ponto.pontuacaoEsforco})` },
                  { nome: 'Score', valor: ponto.score },
                ]}
              />
            );
          }}
        />

        <Scatter data={pontos} fill={COR_PONTO} isAnimationActive={false}>
          <LabelList
            dataKey="id"
            position="right"
            offset={8}
            fill="var(--tinta-secundaria)"
            fontSize={11}
          />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
