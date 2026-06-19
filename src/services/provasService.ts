import { api } from '@/services/api';
import type { ApiResponse, OptionalPageResponse, ProvaDetalhe, ProvaListItem, ProvasPageData, QuestaoListItem } from '@/types/api';
import { dataOf, prop, unwrapApiData } from '@/utils/unknown';

export type CriarProvaPayload = {
  banca: string;
  instituicaoId: number;
  ano: number;
  cargo: string;
  nivel: string;
  modalidade: string;
};

export type CriarQuestaoProvaPayload = {
  enunciado: string | null;
  enunciadoId: number | null;
  questao: string;
  alternativas: string;
  explicacao: string | null;
  textoApoioId: number | null;
  textoApoioTitulo: string | null;
  textoApoioTipo: string | null;
  textoApoioConteudo: string | null;
  textoApoioJson: string | null;
  disciplinaId: number;
  assuntoId: number;
  subassunto: string | null;
  gabarito: string;
};

export async function listarProvas(page: number, size: number) {
  const response = await api.get<ApiResponse<ProvasPageData> | ProvaListItem[]>('/api/v1/provas', {
    params: {
      page,
      size,
      sort: 'criadoEm,desc',
    },
  });

  if (Array.isArray(response.data)) {
    return {
      content: response.data,
      page: {
        size,
        number: page,
        totalElements: response.data.length,
        totalPages: 1,
      },
    };
  }

  const directData = prop(response.data, 'data');

  if (Array.isArray(directData)) {
    const list = directData as ProvaListItem[];
    return {
      content: list,
      page: {
        size,
        number: page,
        totalElements: list.length,
        totalPages: 1,
      },
    };
  }

  return (response.data as ApiResponse<ProvasPageData>).data;
}

export async function obterProva(provaId: number) {
  const response = await api.get(`/api/v1/provas/${provaId}`);
  return unwrapApiData<ProvaDetalhe>(response.data);
}

export async function criarProva(payload: CriarProvaPayload) {
  await api.post('/api/v1/provas', payload);
}

export async function excluirProva(id: number) {
  await api.delete(`/api/v1/provas/${id}`);
}

export async function listarQuestoesDaProva(provaId: number) {
  const response = await api.get<ApiResponse<OptionalPageResponse<QuestaoListItem>> | OptionalPageResponse<QuestaoListItem> | QuestaoListItem[]>(
    '/api/v1/questoes',
    {
      params: {
        page: 0,
        size: 50,
        sort: 'criadoEm,desc',
      },
    }
  );

  let lista: QuestaoListItem[] = [];

  if (Array.isArray(response.data)) {
    lista = response.data;
  } else if (Array.isArray(prop(response.data, 'content'))) {
    lista = (response.data as OptionalPageResponse<QuestaoListItem>).content;
  } else if (Array.isArray(prop(dataOf<unknown>(response.data), 'content'))) {
    lista = prop(dataOf<unknown>(response.data), 'content') as QuestaoListItem[];
  } else if (Array.isArray(dataOf<unknown>(response.data))) {
    lista = dataOf<QuestaoListItem[]>(response.data);
  }

  return lista.filter((questao) => questao.provaId === provaId);
}

export async function criarQuestaoDaProva(provaId: number, payload: CriarQuestaoProvaPayload) {
  await api.post(`/api/v1/provas/${provaId}/questoes`, payload);
}
