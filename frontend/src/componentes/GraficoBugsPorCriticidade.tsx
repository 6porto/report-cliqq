import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMediasSemanais } from '../api/hooks';
import { formatarSemana, paraCampoData } from '../dominio/semanas';
import { Dica } from './Dica';

/** Da base para o topo: o mais crítico encosta no eixo. */
const CRITICIDADES = [
  { chave: 'alta', rotulo: 'Alta', icone: '!', cor: 'var(--status-critico)' },
  { chave: 'media', rotulo: 'Média', icone: '◑', cor: 'var(--status-atencao)' },
  { chave: 'baixa', rotulo: 'Baixa', icone: '○', cor: 'var(--neutro)' },
] as const;

export function GraficoBugsPorCriticidade() {
  const medias = useMediasSemanais();

  if (medias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const pontos = (medias.data ?? [])
    .filter(
      (media) => media.bugsAlta !== null || media.bugsMedia !== null || media.bugsBaixa !== null,
    )
    .map((media) => {
      const alta = media.bugsAlta ?? 0;
      const media_ = media.bugsMedia ?? 0;
      const baixa = media.bugsBaixa ?? 0;

      return {
        semana: paraCampoData(media.semana),
        alta,
        media: media_,
        baixa,
        total: alta + media_ + baixa,
      };
    });

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhuma semana com bugs lançados — informe as contagens em “Lançamentos por semana”.
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
          allowDecimals={false}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
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
                  ...CRITICIDADES.map((criticidade) => ({
                    nome: `${criticidade.icone} ${criticidade.rotulo}`,
                    valor: String(ponto[criticidade.chave]),
                    cor: criticidade.cor,
                  })),
                  { nome: 'Total em aberto', valor: String(ponto.total) },
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
        {CRITICIDADES.map((criticidade, indice) => (
          <Bar
            key={criticidade.chave}
            name={`${criticidade.icone} ${criticidade.rotulo}`}
            dataKey={criticidade.chave}
            stackId="bugs"
            fill={criticidade.cor}
            stroke="var(--superficie)"
            strokeWidth={2}
            radius={indice === CRITICIDADES.length - 1 ? [4, 4, 0, 0] : undefined}
            maxBarSize={36}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
