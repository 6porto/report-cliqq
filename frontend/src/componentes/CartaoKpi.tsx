interface Props {
  rotulo: string;
  valor: string | number;
  apoio?: string;
}

export function CartaoKpi({ rotulo, valor, apoio }: Props) {
  return (
    <div className="cartao">
      <p className="kpi-rotulo">{rotulo}</p>
      <p className="kpi-valor">{valor}</p>
      {apoio ? <p className="kpi-apoio">{apoio}</p> : null}
    </div>
  );
}
