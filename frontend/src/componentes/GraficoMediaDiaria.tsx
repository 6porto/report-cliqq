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

/** Dias de operação considerados em cada semana lançada. */
export const DIAS_DE_OPERACAO = 6;

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

const porDia = (total: number) => Number((total / DIAS_DE_OPERACAO).toFixed(1));

export function GraficoMediaDiaria() {
  const medias = useMediasSemanais();

  if (medias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const pontos = (medias.data ?? [])
    .filter(
      (media) => media.operacoesCentralizado !== null || media.pedidosLegadoPiloto !== null,
    )
    .map((media) => {
      const centralizado = media.operacoesCentralizado;
      const legadoPiloto = media.pedidosLegadoPiloto;
      // O piloto é tudo que passou pelas lojas no ar: centralizado mais o que ficou no legado.
      const totalDoPiloto =
        centralizado === null && legadoPiloto === null
          ? null
          : (centralizado ?? 0) + (legadoPiloto ?? 0);

      return {
        semana: paraCampoData(media.semana),
        centralizadoPorDia: centralizado === null ? null : porDia(centralizado),
        pilotoPorDia: totalDoPiloto === null ? null : porDia(totalDoPiloto),
        centralizadoNaSemana: centralizado,
        pilotoNaSemana: totalDoPiloto,
      };
    });

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhuma semana com operações lançadas — informe os totais em “Lançamentos por semana”.
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
          tickFormatter={(valor) => formatarNumero(Number(valor))}
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
                    nome: 'CliQQ Centralizado',
                    valor:
                      ponto.centralizadoPorDia === null
                        ? '—'
                        : `${formatarNumero(ponto.centralizadoPorDia)}/dia · ${formatarNumero(
                            ponto.centralizadoNaSemana ?? 0,
                          )} na semana`,
                    cor: 'var(--serie-1)',
                  },
                  {
                    nome: 'Lojas do piloto',
                    valor:
                      ponto.pilotoPorDia === null
                        ? '—'
                        : `${formatarNumero(ponto.pilotoPorDia)}/dia · ${formatarNumero(
                            ponto.pilotoNaSemana ?? 0,
                          )} na semana`,
                    cor: 'var(--serie-2)',
                  },
                ]}
              />
            );
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          wrapperStyle={{ fontSize: 12, color: 'var(--tinta-secundaria)' }}
        />
        <Line
          name="CliQQ Centralizado"
          type="monotone"
          dataKey="centralizadoPorDia"
          stroke="var(--serie-1)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          name="Lojas do piloto"
          type="monotone"
          dataKey="pilotoPorDia"
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
