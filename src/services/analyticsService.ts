import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';

export type AnalyticsRankingItem = { id: number | null; label: string; total: number };
export type AnalyticsDashboard = {
  from: string; to: string; onlineWindowMinutes: number;
  overview: { activeToday:number; activePeriod:number; realActive:number; onlineNow:number; sessions:number; averageSessionSeconds:number; questionsToday:number; questionsPeriod:number; averageAccuracy:number; devices:number; identifiedUsers:number };
  activation: { newIdentities:number; appOpened:number; firstQuestionViewed:number; firstQuestionAnswered:number; activationRate:number; averageMinutesToFirstAnswer:number };
  engagement: { questionsPerActive:number; sessionsPerActive:number; identitiesWith10Questions:number; identitiesWith50Questions:number; engagedLast7Days:number; inactiveUsers:number };
  retention: { day1:number; day7:number; day30:number; method:string };
  content: { topScreens:AnalyticsRankingItem[]; topFilters:AnalyticsRankingItem[]; disciplinesAccessed:AnalyticsRankingItem[]; disciplinesAnswered:AnalyticsRankingItem[]; subjectsAccessed:AnalyticsRankingItem[]; subjectsAnswered:AnalyticsRankingItem[]; subsubjectsAccessed:AnalyticsRankingItem[]; subsubjectsAnswered:AnalyticsRankingItem[]; mostWrongQuestions:AnalyticsRankingItem[]; mostCorrectQuestions:AnalyticsRankingItem[]; filtersWithoutResults:number; searchesWithoutResults:number };
  dataQuality: { eventsLast24Hours:number; lastEventAt:string|null; eventsByAppVersion:Record<string,number>; unknownEvents:number; missingSessionPercent:number; missingIdentityPercent:number; recentErrors:AnalyticsRankingItem[] };
  dailyTrend: Array<{ date:string; active:number; sessions:number; questions:number; accuracy:number }>;
};
export type AnalyticsFilters = { period:'today'|'7d'|'30d'|'current_month'|'custom'; startDate?:string; endDate?:string; disciplinaId?:number; assuntoId?:number; subassuntoId?:number; bancaId?:number; instituicaoId?:number; provaId?:number };
export async function obterAnalyticsDashboard(filters: AnalyticsFilters) {
  const response = await api.get<ApiResponse<AnalyticsDashboard>|AnalyticsDashboard>('/api/v1/admin/analytics/dashboard',{params:filters});
  const payload=response.data; return ('data' in payload ? payload.data : payload) as AnalyticsDashboard;
}
