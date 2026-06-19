import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';

export type AnalyticsRankingItem = {
  id: number | null;
  label: string;
  total: number;
};

export type AnalyticsDashboard = {
  from: string;
  to: string;
  onlineWindowMinutes: number;
  summary: {
    totalDevices: number;
    activeUsersToday: number;
    activeUsersInPeriod: number;
    onlineNow: number;
    questionsAnsweredToday: number;
    questionsAnsweredInPeriod: number;
    averageInteractionSeconds: number;
  };
  topScreens: AnalyticsRankingItem[];
  topFilters: AnalyticsRankingItem[];
  topDisciplinas: AnalyticsRankingItem[];
  topAssuntos: AnalyticsRankingItem[];
  topSubassuntos: AnalyticsRankingItem[];
};

export type AnalyticsFilters = {
  from: string;
  to: string;
  disciplinaId?: number;
  assuntoId?: number;
  subassuntoId?: number;
};

export async function obterAnalyticsDashboard(filters: AnalyticsFilters) {
  const response = await api.get<ApiResponse<AnalyticsDashboard> | AnalyticsDashboard>(
    '/api/v1/admin/analytics/dashboard',
    { params: filters }
  );
  const payload = response.data;
  return ('data' in payload ? payload.data : payload) as AnalyticsDashboard;
}
