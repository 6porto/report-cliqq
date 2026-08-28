import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Dica } from './Dica';

export interface FatiaDaRosca {
  chave: string;
  rotulo: string;
  valor: number;
  cor: string;
  /** Ícone opcional, para a identidade não depender só da cor. */
  icone?: string;
}

interface Props {
  fatias: FatiaDaRosca[];
  /** Texto grande no miolo da rosca. */
  destaque: string;
  /** Linha abaixo do destaque. */
  legendaDoDestaque: string;
  /** Como chamar o que está sendo contado, ex.: "operações". */
  unidade: string;
  /** Mensagem quando não há o que somar. */
  vazio: string;
}

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

export function RoscaProporcao({ fatias, destaque, legendaDoDestaque, unidade, vazio }: Props) {
  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);

  if (total <= 0) {
    return <p className="carregando">{vazio}</p>;
  }

  const percentual = (valor: number) => Number(((valor / total) * 100).toFixed(1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="rosca-envolucro">
        <div className="rosca-centro" aria-hidden>
          <strong>{destaque}</strong>
          <span>{legendaDoDestaque}</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <Dica
                    titulo={String(payload[0].payload.rotulo)}
                    itens={[
                      {
                        nome: unidade,
                        valor: formatarNumero(Number(payload[0].payload.valor)),
                      },
                      {
                        nome: 'Do total',
                        valor: `${percentual(Number(payload[0].payload.valor)).toLocaleString('pt-BR')}%`,
                      },
                    ]}
                  />
                ) : null
              }
            />
            <Pie
              data={fatias}
              dataKey="valor"
              nameKey="rotulo"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={1}
              stroke="var(--superficie)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {fatias.map((fatia) => (
                <Cell key={fatia.chave} fill={fatia.cor} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="legenda-pizza">
        {fatias.map((fatia) => (
          <li key={fatia.chave}>
            <span className="marca" style={{ background: fatia.cor }} aria-hidden />
            <span>
              {fatia.icone ? `${fatia.icone} ` : ''}
              {fatia.rotulo}
            </span>
            <span className="legenda-pizza-valor">
              {formatarNumero(fatia.valor)} · {percentual(fatia.valor).toLocaleString('pt-BR')}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
