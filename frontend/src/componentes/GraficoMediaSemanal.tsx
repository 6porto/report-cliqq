import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMediasSemanais } from '../api/hooks';
import { formatarSemana, paraCampoData } from '../dominio/semanas';
import { Dica } from './Dica';

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

export function GraficoMediaSemanal() {
  const medias = useMediasSemanais();

  if (medias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const pontos = (medias.data ?? []).map((media) => {
    const realizado = media.pedidosLegadoPiloto;
    const centralizado = media.operacoesCentralizado;

    return {
      semana: paraCampoData(media.semana),
      centralizado,
      realizado,
      aderencia:
        centralizado === null || realizado === null || realizado <= 0
          ? null
          : Number(((centralizado / realizado) * 100).toFixed(1)),
    };
  });

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhum lançamento ainda — use o botão “Lançamentos” para registrar uma semana.
      </p>
    );
  }

  const tetoDaAderencia = Math.max(
    100,
    ...pontos.map((ponto) => Math.ceil((ponto.aderencia ?? 0) / 25) * 25),
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={pontos} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
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
          yAxisId="operacoes"
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <YAxis
          yAxisId="aderencia"
          orientation="right"
          domain={[0, tetoDaAderencia]}
          tickFormatter={(valor) => `${valor}%`}
          tick={{ fill: 'var(--serie-violeta)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          cursor={{ fill: 'var(--grade)', fillOpacity: 0.4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const ponto = payload[0].payload as (typeof pontos)[number];
            const diferenca =
              ponto.realizado === null || ponto.centralizado === null
                ? null
                : ponto.centralizado - ponto.realizado;

            const itens: { nome: string; valor: string; cor?: string }[] = [
              {
                nome: 'Operações no centralizado',
                valor:
                  ponto.centralizado === null
                    ? 'sem lançamento na semana'
                    : formatarNumero(ponto.centralizado),
                cor: 'var(--serie-1)',
              },
              {
                nome: 'Realizado pelas lojas',
                valor:
                  ponto.realizado === null
                    ? 'sem lançamento na semana'
                    : formatarNumero(ponto.realizado),
                cor: 'var(--serie-2)',
              },
            ];

            if (ponto.aderencia !== null) {
              itens.push({
                nome: 'Lançado sobre o realizado',
                valor: `${ponto.aderencia.toLocaleString('pt-BR')}%`,
                cor: 'var(--serie-violeta)',
              });
            }

            if (diferenca !== null) {
              itens.push({
                nome: 'Diferença',
                valor: `${diferenca > 0 ? '+' : ''}${formatarNumero(diferenca)} operações`,
              });
            }

            return <Dica titulo={`Semana de ${formatarSemana(String(label))}`} itens={itens} />;
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          wrapperStyle={{ fontSize: 12, color: 'var(--tinta-secundaria)' }}
        />
        <Bar
          yAxisId="operacoes"
          name="Operações no centralizado"
          dataKey="centralizado"
          fill="var(--serie-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Bar
          yAxisId="operacoes"
          name="Realizado pelas lojas"
          dataKey="realizado"
          fill="var(--serie-2)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Line
          yAxisId="aderencia"
          name="Lançado sobre o realizado (%)"
          type="monotone"
          dataKey="aderencia"
          stroke="var(--serie-violeta)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
