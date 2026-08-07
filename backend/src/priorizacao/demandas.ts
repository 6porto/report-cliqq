export interface Demanda {
  id: number;
  descricao: string;
}

/** Fonte temporária: as demandas passarão a vir das issues do GitLab. */
export const DEMANDAS: Demanda[] = [
  { id: 812, descricao: 'Canais de envio de notificação para o cliente no acompanhamento do pedido' },
  { id: 834, descricao: 'Bloqueio de venda para filial sem estoque reservado no CliQQ' },
  { id: 847, descricao: 'Carrossel de produtos complementares na tela de fechamento do pedido' },
  { id: 851, descricao: 'Correção do cálculo de frete para filiais sem CEP cadastrado' },
  { id: 866, descricao: 'Relatório de autonomia de desconto por vendedor no fechamento do mês' },
  { id: 879, descricao: 'Login único entre CliQQ e qq-auth com renovação silenciosa de token' },
  { id: 884, descricao: 'Busca por código de barras direto no leitor do coletor da loja' },
  { id: 893, descricao: 'Migração das consultas de preço do batch-vcs para o qq-preco' },
  { id: 902, descricao: 'Tela de conferência de seguros vendidos junto ao pedido' },
  { id: 915, descricao: 'Cache de imagens do qq-midia para lojas com internet instável' },
];
