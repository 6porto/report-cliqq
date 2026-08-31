import type { ReactNode } from 'react';
import { dividirVersao, type AcaoDeVersao } from '../dominio/versao';

interface Props {
  base: string | null;
  nova: string;
  acao: AcaoDeVersao;
  /** Ação de trocar a base, logo abaixo da tag de hoje. */
  troca?: ReactNode;
}

const EXPLICACAO: Record<AcaoDeVersao, string> = {
  rc: 'nova RC sobre a mesma correção',
  patch: 'nova correção sobre a mesma minor',
  minor: 'nova minor',
};

/** O salto entre a tag atual e a nova, com só o trecho alterado em cor. */
export function SaltoDeVersao({ base, nova, acao, troca }: Props) {
  const partes = dividirVersao(acao, nova);

  return (
    <div className="salto">
      <div className="salto-lado">
        <span className="salto-eixo">Hoje</span>
        <span className="salto-base">{base ?? 'sem tag anterior'}</span>
        {troca}
      </div>

      <span className="salto-seta" aria-hidden>
        →
      </span>

      <div className="salto-lado salto-destino">
        <span className="salto-eixo">{EXPLICACAO[acao]}</span>
        <span className="salto-nova">
          {partes.base}
          <span className="salto-trecho">{partes.destaque}</span>
        </span>
      </div>
    </div>
  );
}
