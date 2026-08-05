import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Projecao } from '../api/tipos';
import { Dica } from './Dica';

interface Cenario {
  projecao: Projecao;
  rotulo: string;
  cor: string;
}

interface Props {
  cenarios: Cenario[];
}

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

interface LinhaDoGrafico {
  semana: number;
  [chave: string]: number | null;
}

function montarDados(cenarios: Cenario[]): LinhaDoGrafico[] {
  const semanas = Math.max(...cenarios.map((cenario) => cenario.projecao.semanasParaConcluir));

  return Array.from({ length: semanas + 1 }, (_, semana) => {
    const linha: LinhaDoGrafico = { semana };

    cenarios.forEach((cenario, indice) => {
      const ponto = cenario.projecao.pontos.find((item) => item.semana === semana);
      linha[`operacoes${indice}`] = ponto ? ponto.operacoesAcumuladas : null;
      linha[`lojas${indice}`] = ponto ? ponto.lojasAcumuladas : null;
      linha[`percentual${indice}`] = ponto ? ponto.percentualAcumulado : null;
    });

    return linha;
  });
}

const TRACOS = ['0', '10 4', '2 4', '12 4 2 4', '6 3 1 3'];

const rotularCenario = (cenario: Cenario) =>
  `${cenario.rotulo} · ${cenario.projecao.semanasParaConcluir} semanas`;

export function GraficoProjecao({ cenarios }: Props) {
  const dados = montarDados(cenarios);
  const operacoesTotais = cenarios[0].projecao.operacoesTotais;
  const totalDeLojas = cenarios[0].projecao.totalDeLojas;

  const linhasDoMaiorParaOMenor = cenarios
    .map((cenario, indice) => ({ cenario, indice }))
    .reverse();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={dados} margin={{ top: 16, right: 16, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="var(--grade)" vertical={false} />
        <XAxis
          dataKey="semana"
          tickFormatter={(valor) => `S${valor}`}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--linha-base)' }}
          minTickGap={12}
        />
        <YAxis
          domain={[0, Math.ceil(operacoesTotais / 1000) * 1000]}
          tickFormatter={(valor) => formatarNumero(valor)}
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

            const linha = payload[0].payload as LinhaDoGrafico;

            return (
              <Dica
                titulo={`Semana ${label}`}
                itens={cenarios.map((cenario, indice) => {
                  const operacoes = linha[`operacoes${indice}`];

                  return {
                    nome: cenario.rotulo,
                    cor: cenario.cor,
                    valor:
                      operacoes === null || operacoes === undefined
                        ? 'concluído'
                        : `${formatarNumero(operacoes)}/dia · ${linha[`percentual${indice}`]}% · ${
                            linha[`lojas${indice}`]
                          }/${totalDeLojas} lojas`,
                  };
                })}
              />
            );
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          content={() => (
            <ul className="legenda-projecao">
              {linhasDoMaiorParaOMenor.map(({ cenario, indice }) => (
                <li key={cenario.rotulo}>
                  <svg width={22} height={8} aria-hidden>
                    <line
                      x1={0}
                      y1={4}
                      x2={22}
                      y2={4}
                      stroke={cenario.cor}
                      strokeWidth={2}
                      strokeDasharray={TRACOS[indice % TRACOS.length]}
                    />
                  </svg>
                  {rotularCenario(cenario)}
                </li>
              ))}
            </ul>
          )}
        />
        <ReferenceLine
          y={operacoesTotais}
          stroke="var(--neutro)"
          strokeDasharray="6 4"
          strokeWidth={2}
          label={{
            value: `Rede completa · ${formatarNumero(operacoesTotais)}/dia`,
            position: 'insideTopLeft',
            fill: 'var(--tinta-secundaria)',
            fontSize: 11,
          }}
        />
        {linhasDoMaiorParaOMenor.map(({ cenario, indice }) => (
          <Line
            key={cenario.rotulo}
            type="monotone"
            dataKey={`operacoes${indice}`}
            name={rotularCenario(cenario)}
            stroke={cenario.cor}
            strokeWidth={2}
            strokeDasharray={TRACOS[indice % TRACOS.length]}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--superficie)' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
