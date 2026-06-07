import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useAtivarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ativarUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.all }),
  });
}

export function useExcluirUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: excluirUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.all }),
  });
}
