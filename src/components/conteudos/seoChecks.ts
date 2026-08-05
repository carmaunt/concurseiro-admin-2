export type SeoDraft = {
  titulo: string;
  slug?: string;
  resumo: string;
  conteudo: string;
  imagemCapa?: string;
  imagemCapaAlt?: string;
  autorNome?: string;
  fontesOficiais?: Array<{ nome: string; url: string }>;
  categoriaId?: number | null;
  tagIds?: number[];
  seoTitulo?: string;
  seoDescricao?: string;
};

export type ImageDimensions = {
  width: number;
  height: number;
};

export type SeoCheckStatus = 'pass' | 'warning' | 'error';

export type SeoCheck = {
  id: string;
  label: string;
  detail: string;
  status: SeoCheckStatus;
  blocking: boolean;
};

function check(
  id: string,
  label: string,
  passed: boolean,
  success: string,
  issue: string,
  blocking = false,
): SeoCheck {
  return {
    id,
    label,
    detail: passed ? success : issue,
    status: passed ? 'pass' : blocking ? 'error' : 'warning',
    blocking: blocking && !passed,
  };
}

function validSource(source: { nome: string; url: string }) {
  if (!source.nome.trim()) return false;
  try {
    const url = new URL(source.url);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function evaluateSeoDraft(
  draft: SeoDraft,
  options: { hasSelectedCover?: boolean; coverDimensions?: ImageDimensions | null } = {},
) {
  const title = (draft.seoTitulo || draft.titulo).trim();
  const description = (draft.seoDescricao || draft.resumo).trim();
  const body = draft.conteudo.trim();
  const sources = (draft.fontesOficiais ?? []).filter((source) => source.nome.trim() || source.url.trim());
  const hasCover = Boolean(draft.imagemCapa?.trim() || options.hasSelectedCover);
  const hasH1InBody = /^#\s+\S/m.test(body);
  const hasH2 = /^##\s+\S/m.test(body);
  const hasInternalLink = /\[[^\]]+\]\((?:https:\/\/appoconcurseiro\.com\.br)?\//i.test(body);
  const slug = draft.slug?.trim() ?? '';
  const tagsCount = draft.tagIds?.length ?? 0;

  const checks: SeoCheck[] = [
    check('title', 'Título da página', Boolean(draft.titulo.trim()), 'Título informado.', 'Informe um título específico.', true),
    check('slug', 'Slug estável', !slug || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), slug ? 'Slug limpo e legível.' : 'O backend criará o slug.', 'Use apenas letras minúsculas, números e hífens.', true),
    check('heading', 'Hierarquia de títulos', !hasH1InBody, 'O H1 será gerado apenas pelo título.', 'Remova “# Título” do corpo; comece as seções com “##”.', true),
    check('cover', 'Imagem de capa', hasCover, 'Capa informada.', 'Adicione uma capa relevante antes de publicar.', true),
    check('cover-alt', 'Texto alternativo da capa', Boolean(draft.imagemCapaAlt?.trim()), 'Texto alternativo informado.', 'Descreva objetivamente o que aparece na capa.', true),
    check('author', 'Autoria', Boolean(draft.autorNome?.trim()), 'Autor identificado.', 'Identifique o responsável editorial.', true),
    check('category', 'Categoria principal', Boolean(draft.categoriaId), 'Categoria selecionada.', 'Selecione uma categoria principal.', true),
    check('sources', 'Fonte verificável', sources.length > 0 && sources.every(validSource), 'Fontes preenchidas com nome e URL válidos.', 'Inclua ao menos uma fonte com nome e URL HTTP(S) válida.', true),
    check('seo-title', 'Título para busca', title.length >= 30 && title.length <= 60, `${title.length} caracteres; faixa recomendada atendida.`, `${title.length} caracteres; procure ficar entre 30 e 60 sem cortar informação.`),
    check('seo-description', 'Descrição para busca', description.length >= 120 && description.length <= 160, `${description.length} caracteres; faixa recomendada atendida.`, `${description.length} caracteres; procure ficar entre 120 e 160 com uma proposta concreta.`),
    check('sections', 'Seções escaneáveis', hasH2, 'O conteúdo possui ao menos uma seção H2.', 'Organize o texto com seções iniciadas por “##”.'),
    check('internal-link', 'Link interno contextual', hasInternalLink, 'Há link interno no corpo.', 'Inclua um link útil para a página pilar, guia ou conteúdo relacionado.'),
    check('tags', 'Tags com governança', tagsCount >= 3 && tagsCount <= 5, `${tagsCount} tags selecionadas.`, `Há ${tagsCount} tags; use de 3 a 5 tags existentes e realmente relacionadas.`),
  ];

  if (options.hasSelectedCover) {
    const dimensions = options.coverDimensions;
    checks.push(check(
      'cover-width',
      'Largura da nova capa',
      Boolean(dimensions && dimensions.width >= 1200),
      `${dimensions?.width} × ${dimensions?.height} px; largura adequada para visualização grande.`,
      dimensions
        ? `${dimensions.width} × ${dimensions.height} px; use pelo menos 1200 px de largura, idealmente 1280 × 720.`
        : 'Não foi possível confirmar as dimensões da imagem selecionada.',
      true,
    ));
  } else if (hasCover) {
    checks.push({
      id: 'cover-width',
      label: 'Largura da capa atual',
      detail: 'A URL existe, mas a dimensão não está armazenada. Confirme pelo menos 1200 px na próxima substituição.',
      status: 'warning',
      blocking: false,
    });
  }

  return {
    checks,
    passed: checks.filter((item) => item.status === 'pass').length,
    blockingIssues: checks.filter((item) => item.blocking),
    warnings: checks.filter((item) => item.status === 'warning'),
  };
}
