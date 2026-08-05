import type { StatusRollout } from '../api/tipos';
import { COR_STATUS, ICONE_STATUS, ROTULO_STATUS } from '../tema/cores';

interface Props {
  status: StatusRollout[];
}

export function LegendaStatus({ status }: Props) {
  return (
    <ul
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        listStyle: 'none',
        padding: 0,
        margin: '8px 0 0',
      }}
    >
      {status.map((item) => (
        <li key={item} className="badge">
          <span className="marca" style={{ background: COR_STATUS[item] }} aria-hidden />
          {ICONE_STATUS[item]} {ROTULO_STATUS[item]}
        </li>
      ))}
    </ul>
  );
}
