import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
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
    .filter(
      (media) =>
        media.operacoesLegado !== null &&
        media.operacoesCentralizado !== null &&
        media.operacoesLegado + media.operacoesCentralizado > 0,
    )
    .map((media) => {
      const legado = media.operacoesLegado ?? 0;
      const centralizado = media.operacoesCentralizado ?? 0;
      const total = legado + centralizado;

      const penetracao = Number(((centralizado / total) * 100).toFixed(1));

      return {
        semana: paraCampoData(media.semana),
        legado,
        centralizado,
        total,
        penetracao,
        rotulo: `${penetracao}%`,
      };
    });

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhuma semana com as operações dos dois sistemas — informe o legado e o centralizado em
        “Lançamentos por semana”.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={pontos} margin={{ top: 20, right: 16, bottom: 0, left: -12 }}>
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
          cursor={{ fill: 'var(--grade)', fillOpacity: 0.4 }}
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
                    nome: 'Penetração do centralizado',
                    valor: `${ponto.penetracao}%`,
                    cor: 'var(--serie-1)',
                  },
                  { nome: 'Centralizado', valor: `${formatarNumero(ponto.centralizado)} operações` },
                  { nome: 'Legado', valor: `${formatarNumero(ponto.legado)} operações` },
                  { nome: 'Total da semana', valor: `${formatarNumero(ponto.total)} operações` },
                ]}
              />
            );
          }}
        />
        <Bar
          dataKey="penetracao"
          fill="var(--serie-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="rotulo"
            position="top"
            style={{ fill: 'var(--tinta-secundaria)', fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
