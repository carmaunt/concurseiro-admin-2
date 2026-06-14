export type TextoApoioTipo = 'TEXTO' | 'CODIGO' | 'TABELA' | 'IMAGEM';

export type TabelaTextoApoio = {
  colunas: string[];
  linhas: string[][];
};

export type ImagemTextoApoio = {
  url: string;
  alt: string;
  mimeType?: string;
  largura?: number;
  altura?: number;
};

const tabelaVazia: TabelaTextoApoio = {
  colunas: [''],
  linhas: [['']],
};

export function normalizarTipoTextoApoio(tipo?: string | null): TextoApoioTipo {
  if (tipo === 'CODIGO' || tipo === 'TABELA' || tipo === 'IMAGEM') return tipo;
  return 'TEXTO';
}
export function ajustarLinha(linha: string[], tamanho: number) {
  return Array.from({ length: tamanho }, (_, index) => linha[index] ?? '');
}

export function montarFallbackTabela(tabela: TabelaTextoApoio) {
  return [tabela.colunas, ...tabela.linhas]
    .map((linha) => linha.map((celula) => celula.trim()).join(' | ').trim())
    .filter(Boolean)
    .join('\n');
}

export function parseTabelaPipe(raw: string): TabelaTextoApoio {
  const linhas = raw
    .split(/\r?\n/)
    .map((linha) => linha.split('|').map((celula) => celula.trim()))
    .filter((linha) => linha.some(Boolean));

  if (linhas.length === 0) return tabelaVazia;

  const colunas = linhas[0].length ? linhas[0] : [''];
  const corpo = linhas.slice(1).map((linha) => ajustarLinha(linha, colunas.length));

  return {
    colunas,
    linhas: corpo.length ? corpo : [Array.from({ length: colunas.length }, () => '')],
  };
}

export function parseTabelaJson(json: string | null | undefined, fallback = ''): TabelaTextoApoio {
  if (json?.trim()) {
    try {
      const parsed = JSON.parse(json) as Partial<TabelaTextoApoio>;
      if (Array.isArray(parsed.colunas) && Array.isArray(parsed.linhas)) {
        const colunas = parsed.colunas.map(String);
        const quantidadeColunas = colunas.length || 1;

        return {
          colunas: colunas.length ? colunas : [''],
          linhas: parsed.linhas.length
            ? parsed.linhas.map((linha) => ajustarLinha(Array.isArray(linha) ? linha.map(String) : [], quantidadeColunas))
            : [Array.from({ length: quantidadeColunas }, () => '')],
        };
      }
    } catch {
      // Mantém o fallback textual disponível para recuperação manual.
    }
  }

  return fallback.trim() ? parseTabelaPipe(fallback) : tabelaVazia;
}

export function serializarTabela(tabela: TabelaTextoApoio) {
  const limpa: TabelaTextoApoio = {
    colunas: tabela.colunas.map((coluna) => coluna.trim()),
    linhas: tabela.linhas.map((linha) => (
      ajustarLinha(linha, tabela.colunas.length).map((celula) => celula.trim())
    )),
  };

  return {
    conteudo: montarFallbackTabela(limpa),
    conteudoJson: JSON.stringify(limpa),
  };
}

export function parseImagemJson(json: string | null | undefined): ImagemTextoApoio | null {
  if (!json?.trim()) return null;

  try {
    const parsed = JSON.parse(json) as Partial<ImagemTextoApoio>;
    if (typeof parsed.url !== 'string' || !parsed.url.trim()) return null;

    return {
      url: parsed.url.trim(),
      alt: typeof parsed.alt === 'string' ? parsed.alt.trim() : '',
      mimeType: typeof parsed.mimeType === 'string' ? parsed.mimeType : undefined,
      largura: numeroPositivo(parsed.largura),
      altura: numeroPositivo(parsed.altura),
    };
  } catch {
    return null;
  }
}

function numeroPositivo(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}
