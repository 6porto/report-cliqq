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
import { useMediasSemanais, useOperacoesEsperadas } from '../api/hooks';
import { formatarSemana, paraCampoData } from '../dominio/semanas';
import { Dica } from './Dica';

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

export function GraficoMediaSemanal() {
  const medias = useMediasSemanais();
  const esperadas = useOperacoesEsperadas();

  if (medias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const esperadaNoDia = new Map(
    (esperadas.data?.pontos ?? []).map((ponto) => [ponto.dia, ponto.operacoesEsperadas]),
  );

  const pontos = (medias.data ?? []).map((media) => {
    const semana = paraCampoData(media.semana);

    return {
      semana,
      mediaOperacoes: media.mediaOperacoes,
      esperado: esperadaNoDia.get(semana) ?? null,
    };
  });

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhum lançamento ainda — use o botão “Lançamentos” para registrar uma semana.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
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
          width={56}
        />
        <Tooltip
          cursor={{ fill: 'var(--grade)', fillOpacity: 0.4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const ponto = payload[0].payload as (typeof pontos)[number];

            const itens: { nome: string; valor: string; cor?: string }[] = [
              {
                nome: 'Operações lançadas',
                valor: formatarNumero(ponto.mediaOperacoes),
                cor: 'var(--serie-1)',
              },
              {
                nome: 'Esperado pelas lojas no ar',
                valor:
                  ponto.esperado === null
                    ? 'sem histórico para a data'
                    : formatarNumero(ponto.esperado),
                cor: 'var(--serie-2)',
              },
            ];

            if (ponto.esperado !== null && ponto.esperado > 0) {
              itens.push({
                nome: 'Do esperado',
                valor: `${Number(((ponto.mediaOperacoes / ponto.esperado) * 100).toFixed(1))}%`,
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
          name="Operações lançadas"
          dataKey="mediaOperacoes"
          fill="var(--serie-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Line
          name="Esperado pelas lojas no ar"
          type="monotone"
          dataKey="esperado"
          stroke="var(--serie-2)"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={{ r: 3 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
