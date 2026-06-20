import { api } from '@/services/api';
import type { UsuariosPageData } from '@/types/api';

export type ListarUsuariosParams = {
  page?: number;
  size?: number;
};

export async function listarUsuarios(params: ListarUsuariosParams = {}) {
  const response = await api.get('/api/v1/admin/usuarios', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });

  return (response.data?.data ?? response.data) as UsuariosPageData;
}

export async function ativarUsuario(id: number) {
  await api.patch(`/api/v1/admin/usuarios/${id}/ativar`);
}

export async function excluirUsuario(id: number) {
  await api.delete(`/api/v1/admin/usuarios/${id}`);
}
