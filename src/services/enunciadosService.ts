import { api } from '@/services/api';
import type { Enunciado } from '@/types/api';
import { arrayOf, numberProp, stringProp } from '@/utils/unknown';

export async function listarEnunciados(page = 0, size = 200): Promise<Enunciado[]> {
  const response = await api.get('/api/v1/enunciados', { params: { page, size } });

  return arrayOf(response.data)
    .map((item) => ({
      id: numberProp(item, ['id']),
      conteudo: stringProp(item, ['conteudo']),
    }))
    .filter((item) => Number.isFinite(item.id));
}
