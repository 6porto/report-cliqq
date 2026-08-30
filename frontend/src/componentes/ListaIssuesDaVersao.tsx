import type { IssueDaVersao } from '../api/tipos';
import { ordenarIssues, type OrdenacaoIssues } from '../dominio/versao';
import { CartaoIssue } from './CartaoIssue';

interface Props {
  issues: IssueDaVersao[];
  ordenacao: OrdenacaoIssues;
}

export function ListaIssuesDaVersao({ issues, ordenacao }: Props) {
  const ordenadas = ordenarIssues(issues, ordenacao);

  return (
    <div className="lista-issues">
      {ordenadas.map((issue) => (
        <CartaoIssue key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
