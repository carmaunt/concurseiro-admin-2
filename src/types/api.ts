export type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
};

export type PageInfo = {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
};

export type PageResponse<T> = {
  content: T[];
  page: PageInfo;
};

export type OptionalPageResponse<T> = {
  content: T[];
  page?: PageInfo;
  size?: number;
  number?: number;
  totalElements?: number;
  totalPages?: number;
};

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: 'ADMIN' | 'VISITANTE' | 'USUARIO_FINAL';
  status: 'ATIVO' | 'PENDENTE';
  tipoConta?: 'PAINEL' | 'APP';
};

export type CatalogoItem = {
  id: number;
  nome: string;
};

export type TextoApoio = {
  id: number;
  titulo: string | null;
  tipo?: 'TEXTO' | 'CODIGO' | 'TABELA' | 'IMAGEM' | null;
  conteudo: string;
  conteudoJson?: string | null;
};

export type Enunciado = {
  id: number;
  conteudo: string;
};

export type QuestaoListItem = {
  idQuestion: string;
  enunciado: string;
  enunciadoId?: number | null;
  questao: string;
  alternativas: string | null;
  explicacao?: string | null;
  questaoImagemConteudo?: string | null;
  questaoImagemJson?: string | null;
  textoApoioId?: number | null;
  textoApoioTitulo?: string | null;
  textoApoioConteudo?: string | null;
  textoApoioTipo?: 'TEXTO' | 'CODIGO' | 'TABELA' | 'IMAGEM' | null;
  textoApoioJson?: string | null;
  disciplina: string;
  disciplinaId: number;
  assunto: string;
  assuntoId: number;
  banca: string;
  bancaId: number;
  instituicao: string;
  instituicaoId: number;
  ano: number;
  cargo: string;
  nivel: string;
  modalidade: string;
  gabarito: string;
  provaId: number | null;
  criadoEm: string;
  subassunto?: string | null;
};

export type ProvaListItem = {
  id: number;
  banca: string;
  ano: number;
  instituicao: string;
  instituicaoId?: number;
  modalidade: string;
  nivel?: string;
  cargo?: string;
  descricao?: string;
  totalQuestoes?: number;
  criadoEm?: string;
};

export type ProvaDetalhe = ProvaListItem & {
  cargo: string;
  nivel: string;
};

export type QuestoesPageData = PageResponse<QuestaoListItem>;
export type ProvasPageData = PageResponse<ProvaListItem>;
export type UsuariosPageData = OptionalPageResponse<Usuario>;

export type ConteudoTipo = 'NOTICIA' | 'BLOG' | 'CONCURSO_ABERTO' | 'EDITAL_PREVISTO';
export type ConteudoStatus = 'RASCUNHO' | 'PUBLICADO';
export type TaxonomiaStatus = 'ATIVA' | 'ARQUIVADA';

export type TaxonomiaResumo = {
  id: number;
  nome: string;
  slug: string;
};

export type CategoriaEditorial = TaxonomiaResumo & {
  descricao?: string | null;
  status: TaxonomiaStatus;
  quantidadeConteudos: number;
  createdAt: string;
  updatedAt: string;
};

export type TagEditorial = TaxonomiaResumo & {
  status: TaxonomiaStatus;
  quantidadeConteudos: number;
  createdAt: string;
  updatedAt: string;
};

export type ConteudoPortal = {
  id: number;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagemCapa?: string | null;
  imagemCapaAlt?: string | null;
  imagemSecundaria?: string | null;
  imagemSecundariaAlt?: string | null;
  autorNome?: string | null;
  revisadoPor?: string | null;
  fontesOficiais?: Array<{ nome: string; url: string }>;
  categoria?: string | null;
  category?: TaxonomiaResumo | null;
  tags: TaxonomiaResumo[];
  status: ConteudoStatus;
  tipo: ConteudoTipo;
  destaque: boolean;
  publicadoEm?: string | null;
  seoTitulo?: string | null;
  seoDescricao?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConteudosPageData = PageResponse<ConteudoPortal>;
export type CategoriasPageData = PageResponse<CategoriaEditorial>;
export type TagsPageData = PageResponse<TagEditorial>;
