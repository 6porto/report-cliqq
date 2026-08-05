interface ItemDica {
  nome: string;
  valor: number | string;
  cor?: string;
}

interface Props {
  titulo: string;
  itens: ItemDica[];
}

export function Dica({ titulo, itens }: Props) {
  return (
    <div className="dica">
      <strong>{titulo}</strong>
      {itens.map((item) => (
        <div
          key={item.nome}
          style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          {item.cor ? (
            <span className="marca" style={{ background: item.cor }} aria-hidden />
          ) : null}
          <span style={{ color: 'var(--tinta-secundaria)' }}>{item.nome}</span>
          <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
            {item.valor}
          </span>
        </div>
      ))}
    </div>
  );
}
