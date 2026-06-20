import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  ativarUsuario,
  excluirUsuario,
  listarUsuarios,
  type ListarUsuariosParams,
} from '@/services/usuariosService';

export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: (params: ListarUsuariosParams) => [...usuariosKeys.all, params] as const,
};

export function useUsuarios(params: ListarUsuariosParams = {}) {
  return useQuery({
    queryKey: usuariosKeys.list(params),
    queryFn: () => listarUsuarios(params),
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
