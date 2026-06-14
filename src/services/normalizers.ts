import type { CatalogoItem, TextoApoio } from '@/types/api';
import { arrayOf, dataOf, numberProp, prop, stringProp } from '@/utils/unknown';

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
    .map(normalizeSupportText)
    .filter((item) => Number.isFinite(item.id));
}

export function normalizeSupportText(data: unknown): TextoApoio {
  const item = dataOf<unknown>(data);
  const tipo = stringProp(item, ['tipo']).toUpperCase();
  const conteudoJson = prop(item, 'conteudoJson');

  return {
    id: numberProp(item, ['id']),
    titulo: stringProp(item, ['titulo']) || null,
    tipo: tipo === 'CODIGO' || tipo === 'TABELA' || tipo === 'IMAGEM' ? tipo : 'TEXTO',
    conteudo: stringProp(item, ['conteudo']),
    conteudoJson: typeof conteudoJson === 'string' ? conteudoJson : null,
  };
}
