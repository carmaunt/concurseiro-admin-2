import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  alterarStatusConteudo,
  atualizarConteudo,
  criarConteudo,
  excluirConteudo,
  listarConteudos,
  type ConteudoPayload,
  type ConteudosFilters,
} from '@/services/conteudosService';
import type { ConteudoPortal, ConteudoStatus } from '@/types/api';

export const conteudosKeys = {
  all: ['conteudos'] as const,
  list: (page: number, size: number, filters: ConteudosFilters) => [...conteudosKeys.all, page, size, filters] as const,
};

export function useConteudos(page: number, size: number, filters: ConteudosFilters) {
  return useQuery({
    queryKey: conteudosKeys.list(page, size, filters),
    queryFn: () => listarConteudos(page, size, filters),
  });
}

export function useSalvarConteudo(
  options?: UseMutationOptions<ConteudoPortal, unknown, { id?: number; payload: ConteudoPayload }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => (id ? atualizarConteudo(id, payload) : criarConteudo(payload)),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: conteudosKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

export function useAlterarStatusConteudo(
  options?: UseMutationOptions<ConteudoPortal, unknown, { id: number; status: ConteudoStatus }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => alterarStatusConteudo(id, status),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: conteudosKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

export function useExcluirConteudo(options?: UseMutationOptions<void, unknown, number>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirConteudo,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: conteudosKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}
