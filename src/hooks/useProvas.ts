import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  excluirProva,
  listarProvas,
  listarQuestoesDaProva,
} from '@/services/provasService';

export const provasKeys = {
  all: ['provas'] as const,
  list: (page: number, size: number) => [...provasKeys.all, page, size] as const,
  questoes: (provaId: number | null) => [...provasKeys.all, 'questoes', provaId] as const,
};

export function useProvas(page: number, size: number) {
  return useQuery({
    queryKey: provasKeys.list(page, size),
    queryFn: () => listarProvas(page, size),
  });
}

export function useQuestoesDaProva(provaId: number | null) {
  return useQuery({
    queryKey: provasKeys.questoes(provaId),
    queryFn: () => listarQuestoesDaProva(Number(provaId)),
    enabled: Number.isFinite(provaId),
  });
}

export function useExcluirProva(options?: UseMutationOptions<void, unknown, number>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirProva,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: provasKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}
