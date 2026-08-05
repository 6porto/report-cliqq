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
import type { Evolucao } from '../api/tipos';
import { Dica } from './Dica';

interface Props {
  dados: Evolucao;
}

function formatarPeriodo(periodo: string) {
  const [ano, mes, dia] = periodo.split('-');
  return `${dia}/${new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', {
    month: 'short',
  })}`;
}

export function GraficoEvolucao({ dados }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={dados.pontos} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--grade)" vertical={false} />
        <XAxis
          dataKey="periodo"
          tickFormatter={formatarPeriodo}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--linha-base)' }}
          minTickGap={24}
        />
        <YAxis
          domain={[0, dados.total]}
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
                titulo={formatarPeriodo(String(label))}
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
        />
        <Line
          name="Meta acumulada"
          type="monotone"
          dataKey="metaAcumulada"
          stroke="var(--neutro)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          connectNulls
        />
        <Line
          name="Lojas concluídas"
          type="monotone"
          dataKey="realizadoAcumulado"
          stroke="var(--serie-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
