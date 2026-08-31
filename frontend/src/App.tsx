import { useState } from 'react';
import { Backlog } from './paginas/Backlog';
import { Dashboard } from './paginas/Dashboard';
import { Desenvolvimento } from './paginas/Desenvolvimento';
import { Filiais } from './paginas/Filiais';
import { Plano } from './paginas/Plano';
import { Priorizacao } from './paginas/Priorizacao';
import { Versao } from './paginas/Versao';

type Pagina = 'report' | 'plano' | 'lojas' | 'priorizacao' | 'versao' | 'desenvolvimento' | 'backlog';

const ABAS: { pagina: Pagina; rotulo: string }[] = [
  { pagina: 'plano', rotulo: 'Plano' },
  { pagina: 'report', rotulo: 'Report' },
  { pagina: 'lojas', rotulo: 'Lojas' },
  { pagina: 'priorizacao', rotulo: 'Priorização' },
  { pagina: 'versao', rotulo: 'Versão' },
  { pagina: 'desenvolvimento', rotulo: 'Desenvolvimento' },
  { pagina: 'backlog', rotulo: 'Backlog' },
];

export function App() {
  const [pagina, setPagina] = useState<Pagina>('report');

  return (
    <main className="app">
      <header className="cabecalho">
        <div>
          <h1>Rollout CliQQ</h1>
          <p>Acompanhamento da implantação nas lojas</p>
        </div>
        <nav className="abas">
          {ABAS.map((aba) => (
            <button
              key={aba.pagina}
              className="aba"
              aria-current={pagina === aba.pagina ? 'page' : undefined}
              onClick={() => setPagina(aba.pagina)}
            >
              {aba.rotulo}
            </button>
          ))}
        </nav>
      </header>

      {pagina === 'report' ? <Dashboard /> : null}
      {pagina === 'plano' ? <Plano /> : null}
      {pagina === 'lojas' ? <Filiais /> : null}
      {pagina === 'priorizacao' ? <Priorizacao /> : null}
      {pagina === 'versao' ? <Versao /> : null}
      {pagina === 'desenvolvimento' ? <Desenvolvimento /> : null}
      {pagina === 'backlog' ? <Backlog /> : null}
    </main>
  );
}
