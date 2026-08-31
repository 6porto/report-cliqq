import type { Resumo, StatusRollout } from '../api/tipos';
import { COR_STATUS, ICONE_STATUS, ORDEM_PILHA_STATUS, ROTULO_STATUS } from '../tema/cores';

interface Props {
  resumo: Resumo;
  /** Quantas lojas já saíram do "não iniciado" e não estão bloqueadas. */
  operando: number;
  variacao: { texto: string; sentido: 'alta' | 'baixa' | 'estavel' } | null;
}

/** Uma célula por loja da rede, na ordem canônica dos status. */
export function MosaicoDaRede({ resumo, operando, variacao }: Props) {
  const faixas = ORDEM_PILHA_STATUS.map((status) => ({
    status,
    quantidade: resumo.porStatus[status] ?? 0,
  })).filter((faixa) => faixa.quantidade > 0);

  const percentual =
    resumo.total === 0 ? null : Number(((operando / resumo.total) * 100).toFixed(1));

  return (
    <section className="rede">
      <div className="rede-leitura">
        <p className="rede-eixo">Rollout do CliQQ</p>
        <p className="rede-frase">
          <strong>{operando.toLocaleString('pt-BR')}</strong> das{' '}
          {resumo.total.toLocaleString('pt-BR')} lojas já operam no centralizado
        </p>
        <p className="rede-medida">
          <span className="rede-percentual">
            {percentual === null ? '—' : `${percentual.toLocaleString('pt-BR')}%`}
          </span>
          {variacao ? (
            <span className={`rede-variacao rede-${variacao.sentido}`}>
              {variacao.sentido === 'alta' ? '▲' : variacao.sentido === 'baixa' ? '▼' : '■'}{' '}
              {variacao.texto} na semana
            </span>
          ) : null}
        </p>
      </div>

      <div className="rede-celulas" aria-hidden>
        {faixas.map((faixa) =>
          Array.from({ length: faixa.quantidade }, (_, indice) => (
            <span
              key={`${faixa.status}-${indice}`}
              className={
                faixa.status === 'NAO_INICIADO' ? 'rede-loja rede-loja-adiante' : 'rede-loja'
              }
              style={{ background: COR_STATUS[faixa.status as StatusRollout] }}
            />
          )),
        )}
      </div>

      <ul className="rede-legenda">
        {faixas.map((faixa) => (
          <li key={faixa.status}>
            <span className="rede-marca" style={{ background: COR_STATUS[faixa.status] }} />
            <span aria-hidden>{ICONE_STATUS[faixa.status]}</span>
            {ROTULO_STATUS[faixa.status]}
            <strong>{faixa.quantidade.toLocaleString('pt-BR')}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
