import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatusPorDia, StatusRollout } from '../api/tipos';
import { COR_STATUS, ICONE_STATUS, ORDEM_PILHA_STATUS, ROTULO_STATUS } from '../tema/cores';
import { Dica } from './Dica';

interface Props {
  dados: StatusPorDia;
}

function formatarDia(dia: string) {
  const [ano, mes, diaDoMes] = dia.split('-').map(Number);
  return new Date(ano, mes - 1, diaDoMes).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function GraficoStatusPorDia({ dados }: Props) {
  const [ocultos, setOcultos] = useState<StatusRollout[]>([]);

  const alternar = (status: StatusRollout) =>
    setOcultos((atuais) =>
      atuais.includes(status)
        ? atuais.filter((item) => item !== status)
        : [...atuais, status],
    );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={dados.pontos} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--grade)" vertical={false} />
        <XAxis
          dataKey="dia"
          tickFormatter={formatarDia}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--linha-base)' }}
          minTickGap={24}
        />
        <YAxis
          domain={[0, 'auto']}
          allowDecimals={false}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ stroke: 'var(--linha-base)', strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Dica
                titulo={formatarDia(String(label))}
                itens={payload.map((item) => ({
                  nome: String(item.name),
                  valor: item.value == null ? '—' : String(item.value),
                  cor: item.color,
                }))}
              />
            ) : null
          }
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          wrapperStyle={{ fontSize: 12, color: 'var(--tinta-secundaria)' }}
          onClick={(item) => alternar(item.dataKey as StatusRollout)}
          formatter={(valor, item) => (
            <span
              style={{
                cursor: 'pointer',
                opacity: ocultos.includes(item.dataKey as StatusRollout) ? 0.4 : 1,
              }}
            >
              {valor}
            </span>
          )}
        />
        {ORDEM_PILHA_STATUS.map((status) => (
          <Line
            key={status}
            name={`${ICONE_STATUS[status]} ${ROTULO_STATUS[status]}`}
            type="monotone"
            dataKey={status}
            stroke={COR_STATUS[status]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--superficie)' }}
            hide={ocultos.includes(status)}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
