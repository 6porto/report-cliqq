import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DistribuicaoHoraria } from '../api/tipos';
import { Dica } from './Dica';

interface Props {
  distribuicao: DistribuicaoHoraria;
}

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

export function GraficoDistribuicaoHoraria({ distribuicao }: Props) {
  const dados = distribuicao.horas.map((faixa) => ({
    ...faixa,
    rotuloPorMinuto: `${faixa.operacoesPorMinuto.toLocaleString('pt-BR')}/min`,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={dados}
        margin={{ top: 20, right: 12, bottom: 0, left: 4 }}
        barCategoryGap={4}
      >
        <CartesianGrid stroke="var(--grade)" vertical={false} />
        <XAxis
          dataKey="rotulo"
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'var(--linha-base)' }}
          interval={0}
        />
        <YAxis
          tickFormatter={(valor) => formatarNumero(valor)}
          tick={{ fill: 'var(--tinta-mutada)', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          cursor={{ fill: 'var(--grade)', fillOpacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) {
              return null;
            }

            const faixa = payload[0].payload as DistribuicaoHoraria['horas'][number];

            return (
              <Dica
                titulo={`${faixa.rotulo} — ${faixa.percentual}% do dia`}
                itens={[
                  {
                    nome: 'Rede completa',
                    valor: `${formatarNumero(faixa.operacoesRedeCompleta)} op · ${faixa.operacoesPorMinuto.toLocaleString('pt-BR')}/min`,
                    cor: 'var(--serie-1)',
                  },
                  {
                    nome: 'Cobertura atual',
                    valor: `${formatarNumero(faixa.operacoesCobertas)} op · ${faixa.operacoesPorMinutoCobertas.toLocaleString('pt-BR')}/min`,
                  },
                  { nome: '% informado', valor: `${faixa.percentualInformado}%` },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="operacoesRedeCompleta" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {dados.map((faixa) => (
            <Cell
              key={faixa.hora}
              fill={faixa.rotulo === distribuicao.horaDePico ? 'var(--serie-2)' : 'var(--serie-1)'}
            />
          ))}
          <LabelList
            dataKey="rotuloPorMinuto"
            position="top"
            style={{ fill: 'var(--tinta-secundaria)', fontSize: 10 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
