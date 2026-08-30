import type { RepositorioDaVersao } from '../api/tipos';

interface Props {
  repositorios: RepositorioDaVersao[];
}

export function ListaRepositoriosDaVersao({ repositorios }: Props) {
  return (
    <ul className="lista-repositorios">
      {repositorios.map((repositorio) => (
        <li key={repositorio.caminho} className="repositorio">
          <div className="repositorio-identificacao">
            <a
              className="repositorio-nome"
              href={repositorio.url}
              target="_blank"
              rel="noreferrer"
            >
              {repositorio.nome}
            </a>
            <span className="repositorio-caminho">{repositorio.caminho}</span>
          </div>
          <div className="repositorio-contagem">
            <strong>
              {repositorio.tasks} {repositorio.tasks === 1 ? 'task' : 'tasks'}
            </strong>
            <span>
              {repositorio.abertas} abertas · {repositorio.fechadas} fechadas
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
