export function paraCampoData(valor: string) {
  return valor.slice(0, 10);
}

export function formatarSemana(semana: string) {
  const [ano, mes, dia] = semana.split('-').map(Number);

  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatarSemanaCompleta(semana: string) {
  const [ano, mes, dia] = semana.split('-').map(Number);

  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR');
}

export function hoje() {
  return new Date().toISOString().slice(0, 10);
}
