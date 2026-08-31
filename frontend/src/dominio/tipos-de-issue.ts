/**
 * Cor por `type::`. Diferente dos estados, os tipos são poucos e estáveis, então
 * cada um tem sua cor fixa — o que não estiver no mapa fica neutro. As cores
 * vivem em `global.css` (light + dark).
 */
const CLASSE_POR_TIPO: Record<string, string> = {
  bug: 'tipo-bug',
  'bug-impeditivo': 'tipo-bug',
  melhoria: 'tipo-melhoria',
  crm: 'tipo-crm',
  'problemas-produção': 'tipo-producao',
  'problemas-producao': 'tipo-producao',
  performance: 'tipo-performance',
  refactor: 'tipo-refatoracao',
  refatoração: 'tipo-refatoracao',
  refatoracao: 'tipo-refatoracao',
};

export function classeDoTipo(tipo: string) {
  return CLASSE_POR_TIPO[tipo.trim().toLowerCase()] ?? '';
}
