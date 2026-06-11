import { api } from '@/services/api';
import type { ApiResponse, QuestaoListItem, QuestoesPageData } from '@/types/api';

export type CriarQuestaoPayload = {
  enunciado: string;
  questao: string;
  alternativas: string;
  textoApoioId: number | null;
  textoApoioTitulo: string | null;
  textoApoioTipo: string | null;
  textoApoioConteudo: string | null;
  textoApoioJson: string | null;
  disciplinaId: number;
  assuntoId: number;
  subassunto: string | null;
  bancaId: number;
  instituicaoId: number;
  cargo: string;
  ano: number;
  nivel: string;
  modalidade: string;
  gabarito: string;
};

export async function listarQuestoes(page: number, size: number) {
  const response = await api.get<ApiResponse<QuestoesPageData>>('/api/v1/questoes', {
    params: { page, size, sort: 'criadoEm,desc' },
  });

  return response.data.data;
}

export async function criarQuestao(payload: CriarQuestaoPayload) {
  await api.post('/api/v1/questoes', payload);
}

export async function excluirQuestao(idQuestion: QuestaoListItem['idQuestion']) {
  await api.delete(`/api/v1/admin/questoes/${idQuestion}`);
}
