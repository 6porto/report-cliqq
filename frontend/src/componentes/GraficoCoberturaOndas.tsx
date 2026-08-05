import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CoberturaOnda } from '../api/tipos';
import { Dica } from './Dica';

interface Props {
  ondas: CoberturaOnda[];
}

const COR_PREVISTO = 'var(--serie-1)';
const COR_REALIZADO = 'var(--status-bom)';

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

interface RotuloProps {
  x?: number | string;
  y?: number | string;
  value?: string | number;
}

function RotuloAEsquerda({ x, y, value }: RotuloProps) {
  return (
    <text
      x={Number(x)}
      y={Number(y) - 6}
      textAnchor="start"
      fill="var(--tinta-secundaria)"
      fontSize={11}
    >
      {value}
    </text>
  );
}

export function GraficoCoberturaOndas({ ondas }: Props) {
  const dados = ondas.map((onda) => ({
    ...onda,
    rotuloPrevisto: `${onda.percentualPrevistoAcumulado}% · ${formatarNumero(
      onda.operacoesAcumuladas,
    )}/dia`,
    rotuloRealizado: `${onda.percentualRealizadoAcumulado}% · ${formatarNumero(
      onda.operacoesConcluidasAcumuladas,
    )}/dia`,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={dados} margin={{ top: 24, right: 12, bottom: 0, left: -14 }}>
        <CartesianGrid stroke="var(--grade)" vertical={false} />
        <XAxis
          dataKey="nome"
          tick={{ fill: 'var(--tinta-secundaria)', fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--linha-base)' }}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(valor) => `${valor}%`}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
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

            const onda = payload[0].payload as CoberturaOnda;

            return (
              <Dica
                titulo={String(label)}
                itens={[
                  {
                    nome: 'Previsto ao fim da onda',
                    valor: `${onda.percentualPrevistoAcumulado}%`,
                    cor: COR_PREVISTO,
                  },
                  {
                    nome: 'Já concluído',
                    valor: `${onda.percentualRealizadoAcumulado}%`,
                    cor: COR_REALIZADO,
                  },
                  { nome: 'Lojas da onda', valor: `${onda.lojasConcluidas}/${onda.lojas}` },
                  { nome: 'Operações/dia da onda', valor: String(onda.operacoes) },
                  { nome: 'Operações/dia acumuladas', valor: String(onda.operacoesAcumuladas) },
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
          name="Previsto ao fim da onda"
          dataKey="percentualPrevistoAcumulado"
          fill={COR_PREVISTO}
          radius={[4, 4, 0, 0]}
          barSize={38}
          isAnimationActive={false}
        >
          <LabelList dataKey="rotuloPrevisto" content={<RotuloAEsquerda />} />
        </Bar>
        <Bar
          name="Já concluído"
          dataKey="percentualRealizadoAcumulado"
          fill={COR_REALIZADO}
          radius={[4, 4, 0, 0]}
          barSize={38}
          isAnimationActive={false}
        >
          <LabelList dataKey="rotuloRealizado" content={<RotuloAEsquerda />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
