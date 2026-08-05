import type { StatusRollout } from '../api/tipos';
import { COR_STATUS, ICONE_STATUS, ROTULO_STATUS } from '../tema/cores';

interface Props {
  status: StatusRollout;
}

export function BadgeStatus({ status }: Props) {
  return (
    <span className="badge">
      <span className="marca" style={{ background: COR_STATUS[status] }} aria-hidden />
      {ICONE_STATUS[status]} {ROTULO_STATUS[status]}
    </span>
  );
}
