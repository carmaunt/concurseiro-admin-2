import { api } from '@/services/api';
import { normalizeSupportText } from '@/services/normalizers';
import type { TextoApoio } from '@/types/api';
import type { TextoApoioTipo } from '@/components/questoes/textoApoio';

export type UploadImagemTextoApoio = {
  arquivo: File;
  titulo: string | null;
  textoAlternativo: string;
};

export type ImagemQuestaoPayload = {
  questaoImagemConteudo: string | null;
  questaoImagemJson: string | null;
};

export async function enviarImagemTextoApoio({
  arquivo,
  titulo,
  textoAlternativo,
}: UploadImagemTextoApoio): Promise<TextoApoio> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  if (titulo) formData.append('titulo', titulo);
  formData.append('textoAlternativo', textoAlternativo);

  const response = await api.post('/api/v1/admin/textos-apoio/imagens', formData);
  return normalizeSupportText(response.data);
}

export async function enviarImagemQuestao({
  arquivo,
  titulo,
  textoAlternativo,
}: UploadImagemTextoApoio): Promise<ImagemQuestaoPayload> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  if (titulo) formData.append('titulo', titulo);
  formData.append('textoAlternativo', textoAlternativo);

  const response = await api.post('/api/v1/admin/questoes/imagens', formData);
  const imagem = normalizeSupportText(response.data);

  return {
    questaoImagemConteudo: imagem.conteudo || textoAlternativo,
    questaoImagemJson: imagem.conteudoJson || null,
  };
}

export type TextoApoioQuestaoInput = {
  textoApoioId: string;
  textoApoioTitulo: string;
  textoApoioTipo: TextoApoioTipo;
  textoApoioConteudo: string;
  textoApoioJson: string;
  imagemArquivo: File | null;
};

export type TextoApoioQuestaoPayload = {
  textoApoioId: number | null;
  textoApoioTitulo: string | null;
  textoApoioTipo: TextoApoioTipo | null;
  textoApoioConteudo: string | null;
  textoApoioJson: string | null;
};

export type ImagemQuestaoInput = {
  arquivo: File | null;
  textoAlternativo: string;
  titulo?: string | null;
};

export function validarImagemQuestao(input: ImagemQuestaoInput) {
  if (!input.arquivo) return null;

  const alt = input.textoAlternativo.trim();
  if (!alt) return 'Informe o texto alternativo da imagem da questão.';
  if (alt.length > 500) return 'O texto alternativo da imagem da questão deve ter no máximo 500 caracteres.';

  return null;
}

export async function prepararImagemQuestao(input: ImagemQuestaoInput): Promise<ImagemQuestaoPayload> {
  if (!input.arquivo) {
    return {
      questaoImagemConteudo: null,
      questaoImagemJson: null,
    };
  }

  return enviarImagemQuestao({
    arquivo: input.arquivo,
    titulo: input.titulo || null,
    textoAlternativo: input.textoAlternativo.trim(),
  });
}

export function validarTextoApoioQuestao(input: TextoApoioQuestaoInput) {
  if (input.textoApoioId) return null;

  if (input.textoApoioTipo === 'TABELA' && input.textoApoioConteudo.trim() && !input.textoApoioJson.trim()) {
    return 'Converta ou preencha a tabela antes de salvar.';
  }

  if (input.textoApoioTipo === 'IMAGEM') {
    if (!input.imagemArquivo) return 'Selecione a imagem do texto de apoio.';
    if (!input.textoApoioConteudo.trim()) return 'Informe o texto alternativo da imagem.';
    if (input.textoApoioConteudo.trim().length > 500) return 'O texto alternativo deve ter no máximo 500 caracteres.';
  }

  return null;
}

export async function prepararTextoApoioQuestao(
  input: TextoApoioQuestaoInput
): Promise<TextoApoioQuestaoPayload> {
  if (input.textoApoioId) {
    return {
      textoApoioId: Number(input.textoApoioId),
      textoApoioTitulo: null,
      textoApoioTipo: null,
      textoApoioConteudo: null,
      textoApoioJson: null,
    };
  }

  if (input.textoApoioTipo === 'IMAGEM' && input.imagemArquivo) {
    const imagem = await enviarImagemTextoApoio({
      arquivo: input.imagemArquivo,
      titulo: input.textoApoioTitulo.trim() || null,
      textoAlternativo: input.textoApoioConteudo.trim(),
    });

    return {
      textoApoioId: imagem.id,
      textoApoioTitulo: null,
      textoApoioTipo: null,
      textoApoioConteudo: null,
      textoApoioJson: null,
    };
  }

  return {
    textoApoioId: null,
    textoApoioTitulo: input.textoApoioTitulo.trim() || null,
    textoApoioTipo: input.textoApoioTipo,
    textoApoioConteudo: input.textoApoioConteudo.trim() || null,
    textoApoioJson: input.textoApoioJson.trim() || null,
  };
}
