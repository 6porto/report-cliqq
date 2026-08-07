const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${BASE}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    throw new Error(`${resposta.status} ${resposta.statusText}: ${corpo}`);
  }

  return resposta.json() as Promise<T>;
}

export const api = {
  get: <T>(caminho: string) => requisitar<T>(caminho),
  patch: <T>(caminho: string, corpo: unknown) =>
    requisitar<T>(caminho, { method: 'PATCH', body: JSON.stringify(corpo) }),
  post: <T>(caminho: string, corpo: unknown) =>
    requisitar<T>(caminho, { method: 'POST', body: JSON.stringify(corpo) }),
  put: <T>(caminho: string, corpo: unknown) =>
    requisitar<T>(caminho, { method: 'PUT', body: JSON.stringify(corpo) }),
  delete: <T>(caminho: string) => requisitar<T>(caminho, { method: 'DELETE' }),
};

/** O erro carrega o corpo cru da resposta; o que interessa é a mensagem que o Nest devolveu. */
export function mensagemDoErro(erro: unknown) {
  const texto = erro instanceof Error ? erro.message : String(erro);
  const inicio = texto.indexOf('{');

  if (inicio >= 0) {
    try {
      const corpo = JSON.parse(texto.slice(inicio)) as { message?: unknown };

      if (typeof corpo.message === 'string') {
        return corpo.message;
      }
    } catch {
      return texto;
    }
  }

  return texto;
}

export function montarQuery<T extends object>(parametros: T) {
  const busca = new URLSearchParams();

  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      busca.set(chave, String(valor));
    }
  }

  const texto = busca.toString();
  return texto ? `?${texto}` : '';
}
