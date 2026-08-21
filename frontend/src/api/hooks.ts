import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, montarQuery } from './cliente';
import type {
  CoberturaOnda,
  DatasPorStatus,
  DemandaPriorizada,
  DistribuicaoHoraria,
  Evolucao,
  Filial,
  FiltroFiliais,
  Filtros,
  GrupoRollout,
  PaginaFiliais,
  Projecao,
  RespostaPriorizacao,
  Resumo,
  ResumoSincronizacao,
  StatusPorDia,
  StatusRollout,
} from './tipos';

export function useResumo() {
  return useQuery({
    queryKey: ['resumo'],
    queryFn: () => api.get<Resumo>('/relatorio/resumo'),
  });
}

export function useEvolucao(granularidade: 'semana' | 'mes' = 'semana') {
  return useQuery({
    queryKey: ['evolucao', granularidade],
    queryFn: () => api.get<Evolucao>(`/relatorio/evolucao?granularidade=${granularidade}`),
  });
}

export function useStatusPorDia() {
  return useQuery({
    queryKey: ['status-por-dia'],
    queryFn: () => api.get<StatusPorDia>('/relatorio/status-por-dia'),
  });
}

export function useUf() {
  return useQuery({
    queryKey: ['uf'],
    queryFn: () => api.get<GrupoRollout[]>('/relatorio/uf'),
  });
}

export function useCoberturaOndas() {
  return useQuery({
    queryKey: ['cobertura-ondas'],
    queryFn: () => api.get<CoberturaOnda[]>('/relatorio/cobertura-ondas'),
  });
}

export function useDistribuicaoHoraria() {
  return useQuery({
    queryKey: ['distribuicao-horaria'],
    queryFn: () => api.get<DistribuicaoHoraria>('/relatorio/distribuicao-horaria'),
  });
}

export function useProjecao(crescimentoPercentual: number) {
  return useQuery({
    queryKey: ['projecao', crescimentoPercentual],
    queryFn: () => api.get<Projecao>(`/relatorio/projecao?crescimento=${crescimentoPercentual}`),
  });
}

export function usePorte() {
  return useQuery({
    queryKey: ['porte'],
    queryFn: () => api.get<GrupoRollout[]>('/relatorio/porte'),
  });
}

export function useRegional() {
  return useQuery({
    queryKey: ['regional'],
    queryFn: () => api.get<GrupoRollout[]>('/relatorio/regional'),
  });
}

export function useOndas() {
  return useQuery({
    queryKey: ['ondas'],
    queryFn: () => api.get<GrupoRollout[]>('/relatorio/ondas'),
  });
}

export function useFiliais(filtro: FiltroFiliais) {
  return useQuery({
    queryKey: ['filiais', filtro],
    queryFn: () => api.get<PaginaFiliais>(`/filiais${montarQuery(filtro)}`),
  });
}

export function useFiltros() {
  return useQuery({
    queryKey: ['filtros'],
    queryFn: () => api.get<Filtros>('/filiais/filtros'),
  });
}

export interface CadastroFilial {
  codigo: string;
  cidade: string | null;
  uf: string | null;
  regional: string | null;
  onda: string | null;
  mediaOperacoes90Dias: number;
  observacao: string | null;
  dataPrevista: string | null;
  dataInicio: string | null;
  dataConclusao: string | null;
}

export function useAtualizarFilial() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (variaveis: { id: number; cadastro: Partial<CadastroFilial> }) =>
      api.patch<Filial>(`/filiais/${variaveis.id}`, variaveis.cadastro),
    onSuccess: () => {
      clienteQuery.invalidateQueries();
    },
  });
}

export function useRemoverFilial() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<Filial>(`/filiais/${id}`),
    onSuccess: () => {
      clienteQuery.invalidateQueries();
    },
  });
}

export function usePriorizacao() {
  return useQuery({
    queryKey: ['priorizacao'],
    queryFn: () => api.get<DemandaPriorizada[]>('/priorizacao'),
  });
}

export function useSalvarResposta() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (variaveis: { demandaId: number; resposta: Partial<RespostaPriorizacao> }) =>
      api.put<DemandaPriorizada>(`/priorizacao/${variaveis.demandaId}`, variaveis.resposta),
    onSuccess: (demanda) => {
      clienteQuery.setQueryData<DemandaPriorizada[]>(['priorizacao'], (atual) =>
        atual?.map((item) => (item.id === demanda.id ? demanda : item)),
      );
    },
  });
}

export function useSincronizarPriorizacao() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<ResumoSincronizacao>('/priorizacao/sincronizar', {}),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['priorizacao'] });
    },
  });
}

export function useDatasPorStatus(filialId: number | null) {
  return useQuery({
    queryKey: ['datas-por-status', filialId],
    queryFn: () => api.get<DatasPorStatus>(`/rollout/filiais/${filialId}/datas`),
    enabled: filialId !== null,
  });
}

export function useDefinirDatas() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (variaveis: { id: number; datas: Partial<DatasPorStatus> }) =>
      api.put<Filial>(`/rollout/filiais/${variaveis.id}/datas`, { datas: variaveis.datas }),
    onSuccess: () => {
      clienteQuery.invalidateQueries();
    },
  });
}

export function useAtualizarStatus() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (variaveis: {
      id: number;
      status: StatusRollout;
      data?: string;
      observacao?: string;
      autor?: string;
    }) =>
      api.patch<Filial>(`/rollout/filiais/${variaveis.id}/status`, {
        status: variaveis.status,
        data: variaveis.data,
        observacao: variaveis.observacao,
        autor: variaveis.autor,
      }),
    onSuccess: () => {
      clienteQuery.invalidateQueries();
    },
  });
}
