interface Etapa {
  rotulo: string;
  /** O que já foi escolhido nesta etapa; é isso que a trilha mostra de volta. */
  escolha: string | null;
}

interface Props {
  etapas: Etapa[];
  atual: number;
}

export function TrilhaDeEtapas({ etapas, atual }: Props) {
  return (
    <ol className="trilha" aria-label="Etapas da liberação">
      {etapas.map((etapa, indice) => {
        const estado = indice === atual ? 'atual' : indice < atual ? 'cumprida' : 'adiante';

        return (
          <li
            key={etapa.rotulo}
            className={`trilha-etapa trilha-${estado}`}
            aria-current={indice === atual ? 'step' : undefined}
          >
            <span className="trilha-marca">{indice < atual ? '✓' : indice + 1}</span>
            <span className="trilha-texto">
              <span className="trilha-rotulo">{etapa.rotulo}</span>
              <span className="trilha-escolha">{etapa.escolha ?? '—'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
