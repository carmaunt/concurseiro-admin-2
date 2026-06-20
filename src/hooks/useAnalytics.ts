import { useQuery } from '@tanstack/react-query';
import { obterAnalyticsDashboard, obterAnalyticsInsights, type AnalyticsFilters } from '@/services/analyticsService';

const ready=(filters:AnalyticsFilters)=>filters.period!=='custom'||Boolean(filters.startDate&&filters.endDate);

export function useAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', filters],
    queryFn: () => obterAnalyticsDashboard(filters),
    enabled: ready(filters),
    refetchInterval: 60_000,
  });
}

export function useAnalyticsInsights(filters:AnalyticsFilters){
  return useQuery({queryKey:['analytics-insights',filters],queryFn:()=>obterAnalyticsInsights(filters),enabled:ready(filters),refetchInterval:60_000});
}
