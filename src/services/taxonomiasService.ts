import { api } from '@/services/api';
import type {
  ApiResponse,
  CategoriaEditorial,
  CategoriasPageData,
  TagEditorial,
  TagsPageData,
  TaxonomiaResumo,
  TaxonomiaStatus,
} from '@/types/api';

export type TaxonomiaFilters = { q?: string; status?: TaxonomiaStatus | '' };
export type CategoriaPayload = { nome: string; slug?: string; descricao?: string };
export type TagPayload = { nome: string; slug?: string };

export async function listarCategorias(page: number, size: number, filters: TaxonomiaFilters = {}) {
  const response = await api.get<ApiResponse<CategoriasPageData>>('/api/v1/admin/categorias-editoriais', {
    params: { page, size, q: filters.q || undefined, status: filters.status || undefined },
  });
  return response.data.data;
}

export async function listarTags(page: number, size: number, filters: TaxonomiaFilters = {}) {
  const response = await api.get<ApiResponse<TagsPageData>>('/api/v1/admin/tags-editoriais', {
    params: { page, size, q: filters.q || undefined, status: filters.status || undefined },
  });
  return response.data.data;
}

export async function listarCategoriasAtivas() {
  const response = await api.get<ApiResponse<TaxonomiaResumo[]>>('/api/v1/admin/categorias-editoriais/ativas');
  return response.data.data;
}

export async function listarTagsAtivas(q?: string) {
  const response = await api.get<ApiResponse<TaxonomiaResumo[]>>('/api/v1/admin/tags-editoriais/ativas', { params: { q: q || undefined } });
  return response.data.data;
}

export async function criarCategoria(payload: CategoriaPayload) {
  const response = await api.post<ApiResponse<CategoriaEditorial>>('/api/v1/admin/categorias-editoriais', payload);
  return response.data.data;
}

export async function atualizarCategoria(id: number, payload: CategoriaPayload) {
  const response = await api.put<ApiResponse<CategoriaEditorial>>(`/api/v1/admin/categorias-editoriais/${id}`, payload);
  return response.data.data;
}

export async function alterarStatusCategoria(id: number, status: TaxonomiaStatus) {
  const response = await api.patch<ApiResponse<CategoriaEditorial>>(`/api/v1/admin/categorias-editoriais/${id}/status`, null, { params: { status } });
  return response.data.data;
}

export async function criarTag(payload: TagPayload) {
  const response = await api.post<ApiResponse<TagEditorial>>('/api/v1/admin/tags-editoriais', payload);
  return response.data.data;
}

export async function atualizarTag(id: number, payload: TagPayload) {
  const response = await api.put<ApiResponse<TagEditorial>>(`/api/v1/admin/tags-editoriais/${id}`, payload);
  return response.data.data;
}

export async function alterarStatusTag(id: number, status: TaxonomiaStatus) {
  const response = await api.patch<ApiResponse<TagEditorial>>(`/api/v1/admin/tags-editoriais/${id}/status`, null, { params: { status } });
  return response.data.data;
}
