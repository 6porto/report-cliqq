import {
  CartesianGrid,
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

export function GraficoPercentualErros() {
  const latencias = useLatenciasSemanais();

  if (latencias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const pontos = (latencias.data ?? [])
    .filter((latencia) => latencia.percentualErros !== null)
    .map((latencia) => ({
      semana: paraCampoData(latencia.semana),
      erros: latencia.percentualErros as number,
    }));

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhuma semana com erros lançados — informe o % de erros em “Lançamentos por semana”.
      </p>
    );
  }

  const maiorErro = Math.max(...pontos.map((ponto) => ponto.erros));
  // Uma folga acima do pior valor, para a linha não encostar no topo.
  const teto = Math.max(0.1, Number((maiorErro * 1.25).toFixed(3)));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
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
          domain={[0, teto]}
          tickFormatter={(valor) => `${Number(valor).toLocaleString('pt-BR')}%`}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip
          cursor={{ stroke: 'var(--linha-base)', strokeWidth: 1 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const ponto = payload[0].payload as (typeof pontos)[number];

            return (
              <Dica
                titulo={`Semana de ${formatarSemana(String(label))}`}
                itens={[
                  {
                    nome: 'Erros',
                    valor: `${ponto.erros.toLocaleString('pt-BR')}%`,
                    cor: 'var(--serie-1)',
                  },
                ]}
              />
            );
          }}
        />
        <Line
          name="% de erros"
          type="monotone"
          dataKey="erros"
          stroke="var(--serie-1)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
