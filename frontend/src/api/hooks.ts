import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, montarQuery } from './cliente';
import type {
  CoberturaOnda,
  DatasPorStatus,
  DemandaPriorizada,
  DistribuicaoHoraria,
  Filial,
  FiltroFiliais,
  Filtros,
  IssueDaVersao,
  GrupoRollout,
  LatenciaSemanal,
  MediaSemanal,
  Melhoria,
  MilestoneEmDesenvolvimento,
  OperacoesEsperadas,
  PaginaFiliais,
  Projecao,
  RepositoriosDaVersao,
  RespostaPriorizacao,
  Resumo,
  ResumoSincronizacao,
  StatusPorDia,
  StatusRollout,
  TagDeVersao,
  VersaoGerada,
  VersaoPronta,
} from './tipos';

export function useResumo() {
  return useQuery({
    queryKey: ['resumo'],
    queryFn: () => api.get<Resumo>('/relatorio/resumo'),
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

export function useMelhorias() {
  return useQuery({
    queryKey: ['melhorias'],
    queryFn: () => api.get<Melhoria[]>('/melhorias'),
  });
}

export function useMelhoriasEmDestaque() {
  return useQuery({
    queryKey: ['melhorias', 'destaque'],
    queryFn: () => api.get<Melhoria[]>('/melhorias/destaque'),
  });
}

export function useSalvarMelhoria() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (variaveis: {
      id?: number;
      descricao: string;
      dataPrevista: string | null;
      subiuEmProducao: boolean;
    }) => api.put<Melhoria>('/melhorias', variaveis),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['melhorias'] });
    },
  });
}

export function useRemoverMelhoria() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<Melhoria>(`/melhorias/${id}`),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['melhorias'] });
    },
  });
}

export function useOperacoesEsperadas() {
  return useQuery({
    queryKey: ['operacoes-esperadas'],
    queryFn: () => api.get<OperacoesEsperadas>('/relatorio/operacoes-esperadas'),
  });
}

export function useMediasSemanais() {
  return useQuery({
    queryKey: ['medias-semanais'],
    queryFn: () => api.get<MediaSemanal[]>('/medias-semanais'),
  });
}

export function useSalvarMediaSemanal() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (variaveis: {
      semana: string;
      operacoesLegado: number | null;
      operacoesCentralizado: number | null;
      pedidosLegadoPiloto: number | null;
      bugsAlta: number | null;
      bugsMedia: number | null;
      bugsBaixa: number | null;
      bugsDescricao: string | null;
    }) => api.put<MediaSemanal>('/medias-semanais', variaveis),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['medias-semanais'] });
    },
  });
}

export function useRemoverMediaSemanal() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<MediaSemanal>(`/medias-semanais/${id}`),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['medias-semanais'] });
    },
  });
}

export function useLatenciasSemanais() {
  return useQuery({
    queryKey: ['latencias-semanais'],
    queryFn: () => api.get<LatenciaSemanal[]>('/latencias-semanais'),
  });
}

export function useSalvarLatenciaSemanal() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (variaveis: {
      semana: string;
      percentualAte1s: number | null;
      percentualAte3s: number | null;
      percentualErros: number | null;
      requisicoesAcima3s: number | null;
    }) => api.put<LatenciaSemanal>('/latencias-semanais', variaveis),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['latencias-semanais'] });
    },
  });
}

export function useRemoverLatenciaSemanal() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete<LatenciaSemanal>(`/latencias-semanais/${id}`),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['latencias-semanais'] });
    },
  });
}

export function useGerarVersao() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (variaveis: {
      milestone: string;
      repositorios: { repositorio: string; tag: string; issues: number[] }[];
    }) => api.post<VersaoGerada>('/versao/gerar', variaveis),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['versoes-prontas'] });
      clienteQuery.invalidateQueries({ queryKey: ['tags-do-repositorio'] });
    },
  });
}

/** As tags de vários repositórios de uma vez: a versão sai em leva. */
export function useTagsDeVarios(repositorios: string[]) {
  return useQueries({
    queries: repositorios.map((repositorio) => ({
      queryKey: ['tags-do-repositorio', repositorio],
      queryFn: () => api.get<TagDeVersao[]>(`/versao/tags${montarQuery({ repositorio })}`),
    })),
    combine: (respostas) => ({
      carregando: respostas.some((resposta) => resposta.isLoading),
      porRepositorio: Object.fromEntries(
        repositorios.map((repositorio, indice) => [repositorio, respostas[indice]?.data ?? []]),
      ) as Record<string, TagDeVersao[]>,
    }),
  });
}

/** Aba Desenvolvimento: milestones abertas fix/ e release/ já com as issues dentro. */
export function useMilestonesEmDesenvolvimento() {
  return useQuery({
    queryKey: ['milestones-em-desenvolvimento'],
    queryFn: () => api.get<MilestoneEmDesenvolvimento[]>('/desenvolvimento/milestones'),
  });
}

export function useFecharMilestone() {
  const clienteQuery = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api.post<{ id: number; titulo: string; estado: string }>(
        `/desenvolvimento/milestones/${id}/fechar`,
        {},
      ),
    onSuccess: () => {
      clienteQuery.invalidateQueries({ queryKey: ['milestones-em-desenvolvimento'] });
      clienteQuery.invalidateQueries({ queryKey: ['versoes-prontas'] });
    },
  });
}

export function useVersoesProntas() {
  return useQuery({
    queryKey: ['versoes-prontas'],
    queryFn: () => api.get<VersaoPronta[]>('/versao/prontas'),
  });
}

export function useIssuesDaVersao(milestone: string | null) {
  return useQuery({
    queryKey: ['issues-da-versao', milestone],
    queryFn: () => api.get<IssueDaVersao[]>(`/versao/issues${montarQuery({ milestone })}`),
    enabled: milestone !== null,
  });
}

export function useRepositoriosDaVersao(milestone: string | null) {
  return useQuery({
    queryKey: ['repositorios-da-versao', milestone],
    queryFn: () =>
      api.get<RepositoriosDaVersao>(`/versao/repositorios${montarQuery({ milestone })}`),
    enabled: milestone !== null,
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
