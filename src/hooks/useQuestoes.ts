import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { excluirQuestao, listarQuestoes } from '@/services/questoesService';
import type { QuestaoListItem } from '@/types/api';

export const questoesKeys = {
  all: ['questoes'] as const,
  list: (page: number, size: number) => [...questoesKeys.all, page, size] as const,
};

export function useQuestoes(page: number, size: number) {
  return useQuery({
    queryKey: questoesKeys.list(page, size),
    queryFn: () => listarQuestoes(page, size),
  });
}

export function useExcluirQuestao(
  options?: UseMutationOptions<void, unknown, QuestaoListItem['idQuestion']>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirQuestao,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: questoesKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}
