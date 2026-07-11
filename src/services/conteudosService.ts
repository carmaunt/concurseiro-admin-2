import { api } from '@/services/api';
import type { ApiResponse, ConteudoPortal, ConteudoStatus, ConteudoTipo, ConteudosPageData } from '@/types/api';

export type ConteudoPayload = {
  titulo: string;
  slug?: string;
  resumo: string;
  conteudo: string;
  imagemCapa?: string;
  categoriaId?: number | null;
  tagIds?: number[];
  status: ConteudoStatus;
  tipo: ConteudoTipo;
  destaque: boolean;
  seoTitulo?: string;
  seoDescricao?: string;
};

export type ConteudosFilters = {
  tipo?: ConteudoTipo | '';
  status?: ConteudoStatus | '';
  q?: string;
};

export async function listarConteudos(page: number, size: number, filters: ConteudosFilters = {}) {
  const response = await api.get<ApiResponse<ConteudosPageData>>('/api/v1/admin/conteudos', {
    params: {
      page,
      size,
      tipo: filters.tipo || undefined,
      status: filters.status || undefined,
      q: filters.q || undefined,
    },
  });

  return response.data.data;
}

export async function criarConteudo(payload: ConteudoPayload) {
  const response = await api.post<ApiResponse<ConteudoPortal>>('/api/v1/admin/conteudos', payload);
  return response.data.data;
}

export async function atualizarConteudo(id: number, payload: ConteudoPayload) {
  const response = await api.put<ApiResponse<ConteudoPortal>>(`/api/v1/admin/conteudos/${id}`, payload);
  return response.data.data;
}

export async function alterarStatusConteudo(id: number, status: ConteudoStatus) {
  const response = await api.patch<ApiResponse<ConteudoPortal>>(`/api/v1/admin/conteudos/${id}/status`, null, {
    params: { status },
  });
  return response.data.data;
}

export async function excluirConteudo(id: number) {
  await api.delete(`/api/v1/admin/conteudos/${id}`);
}
