import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GrupoRollout } from '../api/tipos';
import { COR_STATUS, ORDEM_PILHA_STATUS, ROTULO_STATUS } from '../tema/cores';
import { Dica } from './Dica';
import { LegendaStatus } from './LegendaStatus';

interface Props {
  grupos: GrupoRollout[];
  larguraRotulo?: number;
}

export function GraficoGrupos({ grupos, larguraRotulo = 132 }: Props) {
  return (
    <>
      <ResponsiveContainer width="100%" height={Math.max(200, grupos.length * 44)}>
        <BarChart
          layout="vertical"
          data={grupos}
          margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
          barCategoryGap={12}
        >
          <CartesianGrid stroke="var(--grade)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--linha-base)' }}
          />
          <YAxis
            type="category"
            dataKey="nome"
            tick={{ fill: 'var(--tinta-secundaria)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={larguraRotulo}
          />
          <Tooltip
            cursor={{ fill: 'var(--grade)', fillOpacity: 0.4 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <Dica
                  titulo={`${label} — ${payload[0].payload.percentualConcluido}% concluído`}
                  itens={[
                    ...[...payload].reverse().map((item) => ({
                      nome: String(item.name),
                      valor: String(item.value),
                      cor: item.color,
                    })),
                    { nome: 'Lojas', valor: String(payload[0].payload.total) },
                    { nome: 'Operações/dia', valor: String(payload[0].payload.operacoes) },
                  ]}
                />
              ) : null
            }
          />
          {ORDEM_PILHA_STATUS.map((status) => (
            <Bar
              key={status}
              dataKey={status}
              name={ROTULO_STATUS[status]}
              stackId="filiais"
              fill={COR_STATUS[status]}
              stroke="var(--superficie)"
              strokeWidth={2}
              isAnimationActive={false}
              barSize={20}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <LegendaStatus status={ORDEM_PILHA_STATUS} />
    </>
  );
}
