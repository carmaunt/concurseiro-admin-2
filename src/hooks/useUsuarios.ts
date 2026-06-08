import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  ativarUsuario,
  excluirUsuario,
  listarUsuarios,
} from '@/services/usuariosService';

export const usuariosKeys = {
  all: ['usuarios'] as const,
};

export function useUsuarios() {
  return useQuery({
    queryKey: usuariosKeys.all,
    queryFn: listarUsuarios,
  });
}

export function useAtivarUsuario(options?: UseMutationOptions<void, unknown, number>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ativarUsuario,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}

export function useExcluirUsuario(options?: UseMutationOptions<void, unknown, number>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirUsuario,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      options?.onSuccess?.(...args);
    },
  });
}
