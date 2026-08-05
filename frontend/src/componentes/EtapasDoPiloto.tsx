import { DURACAO_DO_PILOTO, ETAPAS_DO_PILOTO } from '../dominio/etapas-do-piloto';
import { COR_STATUS, ICONE_STATUS, ROTULO_STATUS } from '../tema/cores';

const formatarDias = (dias: number) => `${dias} ${dias === 1 ? 'dia' : 'dias'}`;

export function EtapasDoPiloto() {
  let diaInicial = 1;

  const etapas = ETAPAS_DO_PILOTO.map((etapa) => {
    const inicio = diaInicial;
    const fim = diaInicial + etapa.duracaoEmDias - 1;
    diaInicial = fim + 1;

    return {
      ...etapa,
      janela: inicio === fim ? `Dia ${inicio}` : `Dias ${inicio} a ${fim}`,
    };
  });

  return (
    <ol className="etapas">
      {etapas.map((etapa, indice) => (
        <li key={etapa.status} className="etapa" style={{ borderTopColor: COR_STATUS[etapa.status] }}>
          <p className="etapa-ordem">Status {indice + 1}</p>
          <p className="etapa-titulo">
            <span className="marca" style={{ background: COR_STATUS[etapa.status] }} aria-hidden />
            {ICONE_STATUS[etapa.status]} {ROTULO_STATUS[etapa.status]}
          </p>
          <p className="etapa-duracao">
            {formatarDias(etapa.duracaoEmDias)} · {etapa.janela}
          </p>
          <p className="etapa-descricao">{etapa.descricao}</p>
          <p className="etapa-legado">{etapa.legado}</p>
        </li>
      ))}
      <li className="etapa etapa-total">
        <p className="etapa-ordem">Total</p>
        <p className="etapa-titulo">Ciclo por loja</p>
        <p className="etapa-duracao">{formatarDias(DURACAO_DO_PILOTO)}</p>
        <p className="etapa-descricao">
          Do início do treinamento até a loja rodar apenas no CliQQ Centralizado, quando o rollout da
          loja é dado como concluído.
        </p>
      </li>
    </ol>
  );
}
