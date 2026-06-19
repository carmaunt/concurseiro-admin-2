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
};

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: 'ADMIN' | 'VISITANTE' | 'USUARIO_FINAL';
  status: 'ATIVO' | 'PENDENTE';
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

export type AnalyticsSummary = {
  totalDevices: number;
  activeUsersToday: number;
  activeUsersInPeriod: number;
  onlineNow: number;
  questionsAnsweredToday: number;
  questionsAnsweredInPeriod: number;
  averageInteractionSeconds: number;
};

export type AnalyticsRankingItem = {
  label: string;
  total: number;
};

export type AnalyticsDashboard = {
  from: string;
  to: string;
  summary: AnalyticsSummary;
  topScreens: AnalyticsRankingItem[];
  topFilters: AnalyticsRankingItem[];
  topDisciplinas: AnalyticsRankingItem[];
  topAssuntos: AnalyticsRankingItem[];
  topSubassuntos: AnalyticsRankingItem[];
};

export type QuestoesPageData = PageResponse<QuestaoListItem>;
export type ProvasPageData = PageResponse<ProvaListItem>;
export type UsuariosPageData = OptionalPageResponse<Usuario>;
