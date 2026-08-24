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
import { useLatenciasSemanais } from '../api/hooks';
import { formatarSemana, paraCampoData } from '../dominio/semanas';
import { Dica } from './Dica';

function formatarMs(valor: number) {
  return `${valor.toLocaleString('pt-BR')} ms`;
}

// Semáforo: quanto maior o percentil, mais grave a cauda. O amarelo e o laranja
// são vizinhos demais para se distinguirem só pela cor (ΔE 13,6), então cada
// linha também tem seu traço.
const PERCENTIS = [
  { chave: 'p50', nome: 'P50 (mediana)', cor: 'var(--status-bom)', traco: undefined },
  { chave: 'p75', nome: 'P75', cor: 'var(--status-atencao)', traco: '7 4' },
  { chave: 'p95', nome: 'P95', cor: 'var(--status-serio)', traco: '2 3' },
  { chave: 'p99', nome: 'P99', cor: 'var(--status-critico)', traco: undefined },
] as const;

export function GraficoLatenciaSemanal() {
  const latencias = useLatenciasSemanais();

  if (latencias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const pontos = (latencias.data ?? []).map((latencia) => ({
    semana: paraCampoData(latencia.semana),
    p50: latencia.p50,
    p75: latencia.p75,
    p95: latencia.p95,
    p99: latencia.p99,
  }));

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhum lançamento ainda — use o botão “Lançamentos” para registrar uma semana.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: -4 }}>
        <CartesianGrid stroke="var(--grade)" vertical={false} />
        <XAxis
          dataKey="semana"
          tickFormatter={formatarSemana}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--linha-base)' }}
          minTickGap={16}
        />
        <YAxis
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(valor) => `${Number(valor).toLocaleString('pt-BR')}`}
          label={{
            value: 'ms',
            position: 'insideTopLeft',
            offset: -4,
            style: { fill: 'var(--tinta-mutada)', fontSize: 11 },
          }}
        />
        <Tooltip
          cursor={{ stroke: 'var(--linha-base)', strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Dica
                titulo={`Semana de ${formatarSemana(String(label))}`}
                itens={payload.map((item) => ({
                  nome: String(item.name),
                  valor: formatarMs(Number(item.value)),
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
        {PERCENTIS.map((percentil) => (
          <Line
            key={percentil.chave}
            name={percentil.nome}
            type="monotone"
            dataKey={percentil.chave}
            stroke={percentil.cor}
            strokeWidth={2}
            strokeDasharray={percentil.traco}
            dot={{ r: 3 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
