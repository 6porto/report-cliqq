import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMediasSemanais } from '../api/hooks';
import { formatarSemana, paraCampoData } from '../dominio/semanas';
import { Dica } from './Dica';

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

export function GraficoAdesaoCentralizado() {
  const medias = useMediasSemanais();

  if (medias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const pontos = (medias.data ?? [])
    .filter((media) => media.operacoesCentralizado !== null && media.operacoesLegado !== null)
    .map((media) => {
      const centralizado = media.operacoesCentralizado ?? 0;
      const total = centralizado + (media.operacoesLegado ?? 0);

      return {
        semana: paraCampoData(media.semana),
        centralizado,
        total,
        adesao: total > 0 ? Number(((centralizado / total) * 100).toFixed(1)) : null,
      };
    })
    .filter((ponto) => ponto.adesao !== null);

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhuma semana com operações do centralizado e do legado — informe os dois em “Lançamentos
        por semana”.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={pontos} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
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
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(valor) => `${valor}%`}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
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
                    nome: 'Adesão da rede',
                    valor: `${(ponto.adesao ?? 0).toLocaleString('pt-BR')}%`,
                    cor: 'var(--serie-1)',
                  },
                  { nome: 'No centralizado', valor: `${formatarNumero(ponto.centralizado)} operações` },
                  { nome: 'Total da rede', valor: `${formatarNumero(ponto.total)} operações` },
                ]}
              />
            );
          }}
        />
        <Line
          name="Todas as lojas"
          type="monotone"
          dataKey="adesao"
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
