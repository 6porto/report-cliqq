import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
  largo?: boolean;
  children: ReactNode;
}

export function CartaoGrafico({ titulo, subtitulo, acoes, largo, children }: Props) {
  return (
    <section className={largo ? 'cartao cartao-largo' : 'cartao'}>
      <header
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <div>
          <h2>{titulo}</h2>
          {subtitulo ? <p className="subtitulo">{subtitulo}</p> : null}
        </div>
        {acoes}
      </header>
      {children}
    </section>
  );
}
