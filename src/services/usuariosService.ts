import { api } from '@/services/api';
import type { UsuariosPageData } from '@/types/api';

export type UsuarioTipoConta = 'PAINEL' | 'APP';
export type UsuarioRole = 'ADMIN' | 'VISITANTE' | 'USUARIO_FINAL';
export type UsuarioStatus = 'ATIVO' | 'PENDENTE';

export type ListarUsuariosParams = {
  page?: number;
  size?: number;
  tipoConta?: UsuarioTipoConta;
  role?: UsuarioRole;
  status?: UsuarioStatus;
};

export async function listarUsuarios(params: ListarUsuariosParams = {}) {
  const response = await api.get('/api/v1/admin/usuarios', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      tipoConta: params.tipoConta,
      role: params.role,
      status: params.status,
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
