import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Resumo, StatusRollout } from '../api/tipos';
import { COR_STATUS, ORDEM_PILHA_STATUS, ROTULO_STATUS } from '../tema/cores';
import { Dica } from './Dica';

interface Props {
  resumo: Resumo;
}

export function GraficoStatus({ resumo }: Props) {
  const dados = ORDEM_PILHA_STATUS.map((status) => ({
    status,
    rotulo: ROTULO_STATUS[status],
    quantidade: resumo.porStatus[status] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        layout="vertical"
        data={dados}
        margin={{ top: 4, right: 40, bottom: 0, left: 8 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide domain={[0, resumo.total]} />
        <YAxis
          type="category"
          dataKey="rotulo"
          tick={{ fill: 'var(--tinta-secundaria)', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={104}
        />
        <Tooltip
          cursor={{ fill: 'var(--grade)', fillOpacity: 0.4 }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <Dica
                titulo={String(payload[0].payload.rotulo)}
                itens={[
                  { nome: 'Lojas', valor: String(payload[0].payload.quantidade) },
                  {
                    nome: 'Do total',
                    valor: `${((payload[0].payload.quantidade / resumo.total) * 100).toFixed(1)}%`,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
          {dados.map((item) => (
            <Cell key={item.status} fill={COR_STATUS[item.status as StatusRollout]} />
          ))}
          <LabelList
            dataKey="quantidade"
            position="right"
            style={{ fill: 'var(--tinta-secundaria)', fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
