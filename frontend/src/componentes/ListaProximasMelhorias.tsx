import { useMelhoriasEmDestaque } from '../api/hooks';
import { formatarSemanaCompleta, paraCampoData } from '../dominio/semanas';

export function ListaProximasMelhorias() {
  const melhorias = useMelhoriasEmDestaque();

  if (melhorias.isLoading) {
    return <p className="carregando">Carregando…</p>;
  }

  const lista = melhorias.data ?? [];

  if (lista.length === 0) {
    return (
      <p className="carregando">
        Nenhuma melhoria prevista — use o botão “Melhorias” para cadastrar.
      </p>
    );
  }

  const previstas = lista.filter((melhoria) => !melhoria.subiuEmProducao);
  const noAr = lista.filter((melhoria) => melhoria.subiuEmProducao);

  return (
    <ul className="lista-melhorias">
      {previstas.map((melhoria) => (
        <li key={melhoria.id}>
          <span className="melhoria-marca" aria-hidden>
            ○
          </span>
          <span className="melhoria-descricao">{melhoria.descricao}</span>
          <span className="melhoria-situacao">
            {melhoria.dataPrevista
              ? `prevista para ${formatarSemanaCompleta(paraCampoData(melhoria.dataPrevista))}`
              : 'sem data prevista'}
          </span>
        </li>
      ))}

      {noAr.map((melhoria) => (
        <li key={melhoria.id} className="melhoria-no-ar">
          <span className="melhoria-marca" aria-hidden>
            ✓
          </span>
          <span className="melhoria-descricao">{melhoria.descricao}</span>
          <span className="melhoria-situacao">
            {melhoria.dataSubida
              ? `no ar em ${formatarSemanaCompleta(paraCampoData(melhoria.dataSubida))}`
              : 'no ar'}
          </span>
        </li>
      ))}
    </ul>
  );
}
