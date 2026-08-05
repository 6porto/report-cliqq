import type { CoberturaOnda } from '../api/tipos';
import { CRITERIO_DAS_ONDAS, CRITERIO_SEM_ONDA } from '../dominio/ondas';

interface Props {
  ondas: CoberturaOnda[];
}

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR');

export function CriterioDasOndas({ ondas }: Props) {
  const totalDeLojas = ondas.reduce((soma, onda) => soma + onda.lojas, 0);
  const totalDeOperacoes = ondas.reduce((soma, onda) => soma + onda.operacoes, 0);

  const linhas = ondas.map((onda) => {
    const criterio = CRITERIO_DAS_ONDAS.find((item) => item.nome === onda.nome);

    return {
      ...onda,
      faixa: criterio?.faixa ?? '—',
      motivo: criterio?.motivo ?? CRITERIO_SEM_ONDA,
      percentualDeLojas:
        totalDeLojas === 0 ? 0 : Number(((onda.lojas / totalDeLojas) * 100).toFixed(1)),
    };
  });

  return (
    <div className="tabela-envolucro">
      <table>
        <thead>
          <tr>
            <th>Onda</th>
            <th>Critério (média de operações/dia nos últimos 90 dias)</th>
            <th>Lojas</th>
            <th>% das lojas</th>
            <th>Operações/dia</th>
            <th>Operações/dia acumulado</th>
            <th>% das operações</th>
            <th>% das operações acumulado</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.nome}>
              <td>{linha.nome}</td>
              <td style={{ whiteSpace: 'normal' }}>
                {linha.faixa}
                <span className="criterio-motivo">{linha.motivo}</span>
              </td>
              <td>{formatarNumero(linha.lojas)}</td>
              <td>{linha.percentualDeLojas}%</td>
              <td>{formatarNumero(linha.operacoes)}</td>
              <td>{formatarNumero(linha.operacoesAcumuladas)}</td>
              <td>{linha.percentualDaRede}%</td>
              <td>{linha.percentualPrevistoAcumulado}%</td>
            </tr>
          ))}
          <tr>
            <td>
              <strong>Total</strong>
            </td>
            <td>—</td>
            <td>
              <strong>{formatarNumero(totalDeLojas)}</strong>
            </td>
            <td>100%</td>
            <td>
              <strong>{formatarNumero(totalDeOperacoes)}</strong>
            </td>
            <td>—</td>
            <td>100%</td>
            <td>100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
