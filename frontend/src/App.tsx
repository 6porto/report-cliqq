import { useState } from 'react';
import { Dashboard } from './paginas/Dashboard';
import { Filiais } from './paginas/Filiais';
import { Plano } from './paginas/Plano';
import { Priorizacao } from './paginas/Priorizacao';

type Pagina = 'report' | 'plano' | 'lojas' | 'priorizacao';

const ABAS: { pagina: Pagina; rotulo: string }[] = [
  { pagina: 'plano', rotulo: 'Plano' },
  { pagina: 'report', rotulo: 'Report' },
  { pagina: 'lojas', rotulo: 'Lojas' },
  { pagina: 'priorizacao', rotulo: 'Priorização' },
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
    </main>
  );
}
