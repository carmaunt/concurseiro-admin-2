import { api } from '@/services/api';
import { normalizeCatalogItem, normalizeCatalogItems, normalizeSupportTexts } from '@/services/normalizers';

type CatalogoTipo = 'bancas' | 'instituicoes' | 'disciplinas';

export async function listarBancas() {
  const response = await api.get('/api/v1/catalogo/bancas');
  return normalizeCatalogItems(response.data);
}

export async function listarInstituicoes() {
  const response = await api.get('/api/v1/catalogo/instituicoes');
  return normalizeCatalogItems(response.data);
}

export async function listarDisciplinas() {
  const response = await api.get('/api/v1/catalogo/disciplinas');
  return normalizeCatalogItems(response.data);
}

export async function listarAssuntosPorDisciplina(disciplinaId: string | number) {
  const response = await api.get(`/api/v1/catalogo/disciplinas/${encodeURIComponent(String(disciplinaId))}/assuntos`);
  return normalizeCatalogItems(response.data);
}

export async function listarSubassuntosPorAssunto(assuntoId: string | number) {
  const response = await api.get(`/api/v1/catalogo/assuntos/${encodeURIComponent(String(assuntoId))}/subassuntos`);
  return normalizeCatalogItems(response.data);
}

export async function listarTextosApoio(page = 0, size = 50) {
  const response = await api.get('/api/v1/textos-apoio', { params: { page, size } });
  return normalizeSupportTexts(response.data);
}

export async function criarItemCatalogo(tipo: CatalogoTipo, nome: string) {
  const response = await api.post(`/api/v1/admin/catalogo/${tipo}`, { nome });
  return normalizeCatalogItem(response.data);
}

export async function criarAssuntoCatalogo(payload: { disciplinaId: number; nome: string }) {
  const response = await api.post('/api/v1/admin/catalogo/assuntos', payload);
  return normalizeCatalogItem(response.data);
}

export async function criarSubassuntoCatalogo(payload: { assuntoId: number; nome: string }) {
  const response = await api.post('/api/v1/admin/catalogo/subassuntos', payload);
  return normalizeCatalogItem(response.data);
}

export type ImportacaoCatalogoResponse = {
  disciplinaId: number;
  disciplina: string;
  assuntosProcessados: number;
  assuntosCriados: number;
  assuntosExistentes: number;
  subassuntosProcessados: number;
  subassuntosCriados: number;
  subassuntosExistentes: number;
};

export async function importarCatalogoTexto(texto: string) {
  const response = await api.post<ImportacaoCatalogoResponse>('/api/v1/admin/catalogo/importar-texto', texto, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  return response.data;
}
