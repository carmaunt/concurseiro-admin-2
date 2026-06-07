import { api } from '@/services/api';
import type { UsuariosPageData } from '@/types/api';

export async function listarUsuarios() {
  const response = await api.get('/api/v1/admin/usuarios?page=0&size=20');
  return (response.data?.data ?? response.data) as UsuariosPageData;
}

export async function ativarUsuario(id: number) {
  await api.patch(`/api/v1/admin/usuarios/${id}/ativar`);
}

export async function excluirUsuario(id: number) {
  await api.delete(`/api/v1/admin/usuarios/${id}`);
}
