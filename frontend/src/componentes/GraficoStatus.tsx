import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Resumo, StatusRollout } from '../api/tipos';
import { COR_STATUS, ICONE_STATUS, ORDEM_PILHA_STATUS, ROTULO_STATUS } from '../tema/cores';
import { Dica } from './Dica';

interface Props {
  resumo: Resumo;
}

export function GraficoStatus({ resumo }: Props) {
  const dados = ORDEM_PILHA_STATUS.map((status) => ({
    status,
    rotulo: ROTULO_STATUS[status],
    quantidade: resumo.porStatus[status] ?? 0,
  })).filter((item) => item.quantidade > 0);

  const percentual = (quantidade: number) =>
    resumo.total === 0 ? 0 : (quantidade / resumo.total) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="rosca-envolucro">
        <div className="rosca-centro" aria-hidden>
          <strong>{resumo.total.toLocaleString('pt-BR')}</strong>
          <span>lojas</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <Dica
                  titulo={String(payload[0].payload.rotulo)}
                  itens={[
                    { nome: 'Lojas', valor: String(payload[0].payload.quantidade) },
                    {
                      nome: 'Do total',
                      valor: `${percentual(Number(payload[0].payload.quantidade)).toFixed(1)}%`,
                    },
                  ]}
                />
              ) : null
            }
          />
          <Pie
            data={dados}
            dataKey="quantidade"
            nameKey="rotulo"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={1}
            stroke="var(--superficie)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {dados.map((item) => (
              <Cell key={item.status} fill={COR_STATUS[item.status as StatusRollout]} />
            ))}
          </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="legenda-pizza">
        {dados.map((item) => (
          <li key={item.status}>
            <span
              className="marca"
              style={{ background: COR_STATUS[item.status as StatusRollout] }}
              aria-hidden
            />
            <span>
              {ICONE_STATUS[item.status as StatusRollout]} {item.rotulo}
            </span>
            <span className="legenda-pizza-valor">
              {item.quantidade} · {percentual(item.quantidade).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
