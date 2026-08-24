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
import { useMediasSemanais } from '../api/hooks';
import { formatarSemana, paraCampoData } from '../dominio/semanas';
import { Dica } from './Dica';

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

const percentual = (parte: number, total: number) =>
  total <= 0 ? null : Number(((parte / total) * 100).toFixed(1));

export function GraficoAdesaoCentralizado() {
  const medias = useMediasSemanais();

  if (medias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const pontos = (medias.data ?? [])
    .filter((media) => media.operacoesCentralizado !== null)
    .map((media) => {
      const centralizado = media.operacoesCentralizado ?? 0;
      const legado = media.operacoesLegado;
      const legadoPiloto = media.pedidosLegadoPiloto;

      return {
        semana: paraCampoData(media.semana),
        centralizado,
        legado,
        legadoPiloto,
        totalRede: legado === null ? null : legado + centralizado,
        totalPiloto: legadoPiloto === null ? null : legadoPiloto + centralizado,
        todasLojas: legado === null ? null : percentual(centralizado, legado + centralizado),
        lojasEmOperacao:
          legadoPiloto === null ? null : percentual(centralizado, legadoPiloto + centralizado),
      };
    })
    .filter((ponto) => ponto.todasLojas !== null || ponto.lojasEmOperacao !== null);

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

            const itens = [
              {
                nome: 'Todas as lojas',
                valor:
                  ponto.todasLojas === null
                    ? 'sem o legado da rede'
                    : `${ponto.todasLojas}% de ${formatarNumero(ponto.totalRede ?? 0)} operações`,
                cor: 'var(--serie-1)',
              },
              {
                nome: 'Lojas em operação',
                valor:
                  ponto.lojasEmOperacao === null
                    ? 'sem o legado do piloto'
                    : `${ponto.lojasEmOperacao}% de ${formatarNumero(
                        ponto.totalPiloto ?? 0,
                      )} operações`,
                cor: 'var(--serie-2)',
              },
              {
                nome: 'No centralizado',
                valor: `${formatarNumero(ponto.centralizado)} operações`,
              },
            ];

            return <Dica titulo={`Semana de ${formatarSemana(String(label))}`} itens={itens} />;
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          wrapperStyle={{ fontSize: 12, color: 'var(--tinta-secundaria)' }}
        />
        <Line
          name="Todas as lojas"
          type="monotone"
          dataKey="todasLojas"
          stroke="var(--serie-1)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          name="Lojas em operação"
          type="monotone"
          dataKey="lojasEmOperacao"
          stroke="var(--serie-2)"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={{ r: 3 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
