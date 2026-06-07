import type { CatalogoItem, TextoApoio } from '@/types/api';
import { arrayOf, dataOf, numberProp, stringProp } from '@/utils/unknown';

export function normalizeCatalogItems(data: unknown): CatalogoItem[] {
  return arrayOf(data)
    .map((item) => ({
      id: numberProp(item, ['id', 'idDisciplina', 'idAssunto', 'idSubassunto', 'idBanca', 'idInstituicao']),
      nome: stringProp(item, ['nome', 'titulo', 'descricao', 'name']),
    }))
    .filter((item) => Number.isFinite(item.id) && Boolean(item.nome));
}

export function normalizeCatalogItem(data: unknown): CatalogoItem {
  const item = dataOf<unknown>(data);

  return {
    id: numberProp(item, ['id', 'idDisciplina', 'idAssunto', 'idSubassunto', 'idBanca', 'idInstituicao']),
    nome: stringProp(item, ['nome', 'titulo', 'descricao', 'name']),
  };
}

export function normalizeSupportTexts(data: unknown): TextoApoio[] {
  return arrayOf(data)
    .map((item) => ({
      id: numberProp(item, ['id']),
      titulo: stringProp(item, ['titulo']) || null,
      conteudo: stringProp(item, ['conteudo']),
    }))
    .filter((item) => Number.isFinite(item.id) && Boolean(item.conteudo));
}
