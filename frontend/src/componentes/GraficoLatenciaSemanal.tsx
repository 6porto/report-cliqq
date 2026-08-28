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
import { useLatenciasSemanais, useMediasSemanais } from '../api/hooks';
import { formatarSemana, paraCampoData } from '../dominio/semanas';
import { Dica } from './Dica';

const FAIXAS = [
  { chave: 'ate1s', rotulo: 'Menor que 1s', cor: 'var(--status-bom)', traco: '0' },
  { chave: 'ate3s', rotulo: 'Menor que 3s', cor: 'var(--status-atencao)', traco: '6 3' },
] as const;

const formatarPercentual = (valor: number | null) =>
  valor === null ? '—' : `${valor.toLocaleString('pt-BR')}%`;

export function GraficoLatenciaSemanal() {
  const latencias = useLatenciasSemanais();
  const medias = useMediasSemanais();

  if (latencias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const transacoesNaSemana = new Map(
    (medias.data ?? [])
      .filter((media) => media.operacoesLegado !== null || media.operacoesCentralizado !== null)
      .map((media) => [
        paraCampoData(media.semana),
        (media.operacoesLegado ?? 0) + (media.operacoesCentralizado ?? 0),
      ]),
  );

  const pontos = (latencias.data ?? [])
    .map((latencia) => {
      const semana = paraCampoData(latencia.semana);

      return {
        semana,
        ate1s: latencia.percentualAte1s,
        ate3s: latencia.percentualAte3s,
        acima3s: latencia.requisicoesAcima3s,
        transacoes: transacoesNaSemana.get(semana) ?? null,
      };
    })
    .filter(
      (ponto) => ponto.ate1s !== null || ponto.ate3s !== null || ponto.acima3s !== null,
    );

  if (pontos.length === 0) {
    return (
      <p className="carregando">
        Nenhuma semana com tempo de resposta lançado — informe os percentuais em “Lançamentos por
        semana”.
      </p>
    );
  }

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
          yAxisId="percentual"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(valor) => `${valor}%`}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <YAxis
          yAxisId="transacoes"
          orientation="right"
          tickFormatter={(valor) => Number(valor).toLocaleString('pt-BR')}
          tick={{ fill: 'var(--serie-1)', fontSize: 11 }}
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
                  ...FAIXAS.map((faixa) => ({
                    nome: faixa.rotulo,
                    valor: formatarPercentual(ponto[faixa.chave]),
                    cor: faixa.cor,
                  })),
                  {
                    nome: 'Total de transações',
                    valor:
                      ponto.transacoes === null
                        ? 'sem operações lançadas'
                        : ponto.transacoes.toLocaleString('pt-BR'),
                    cor: 'var(--serie-1)',
                  },
                  {
                    nome: 'Requisições acima de 3s',
                    valor:
                      ponto.acima3s === null ? '—' : ponto.acima3s.toLocaleString('pt-BR'),
                    cor: 'var(--status-critico)',
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
        <Bar
          yAxisId="transacoes"
          name="Total de transações"
          dataKey="transacoes"
          fill="var(--serie-1)"
          fillOpacity={0.25}
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
          isAnimationActive={false}
        />
        <Bar
          yAxisId="transacoes"
          name="Requisições acima de 3s"
          dataKey="acima3s"
          fill="var(--status-critico)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
          isAnimationActive={false}
        />
        {FAIXAS.map((faixa) => (
          <Line
            key={faixa.chave}
            yAxisId="percentual"
            name={faixa.rotulo}
            type="monotone"
            dataKey={faixa.chave}
            stroke={faixa.cor}
            strokeWidth={2}
            strokeDasharray={faixa.traco}
            dot={{ r: 3 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
