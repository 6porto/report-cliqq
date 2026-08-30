/**
 * Uma linha por repositório, no formato `- nome-reduzido [tag](url)`. Gerar a
 * versão troca a tag da linha existente ou acrescenta a linha no fim.
 */
export function atualizarLinhaDoRepositorio(
  descricao: string | null,
  nomeDoRepositorio: string,
  tag: string,
  urlDaTag: string,
): string {
  const linhaNova = `- ${nomeDoRepositorio} [${tag}](${urlDaTag})`;
  const texto = descricao ?? '';

  if (texto.trim() === '') {
    return linhaNova;
  }

  const procurado = nomeDoRepositorio.toLowerCase();
  const linhas = texto.split(/\r?\n/);
  const posicao = linhas.findIndex((linha) => linha.toLowerCase().includes(procurado));

  if (posicao < 0) {
    return `${texto.replace(/\s+$/, '')}\n${linhaNova}`;
  }

  linhas[posicao] = linhaNova;

  return linhas.join('\n');
}
