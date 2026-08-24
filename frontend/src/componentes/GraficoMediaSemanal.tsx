import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMediasSemanais } from '../api/hooks';
import { formatarSemana, paraCampoData } from '../dominio/semanas';
import { Dica } from './Dica';

export function GraficoMediaSemanal() {
  const medias = useMediasSemanais();

  if (medias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const pontos = (medias.data ?? []).map((media) => ({
    semana: paraCampoData(media.semana),
    mediaOperacoes: media.mediaOperacoes,
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
      <BarChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
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
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <Dica
                titulo={`Semana de ${formatarSemana(String(label))}`}
                itens={[
                  {
                    nome: 'Média de operações/dia',
                    valor: Number(payload[0].value).toLocaleString('pt-BR'),
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="mediaOperacoes"
          fill="var(--serie-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
