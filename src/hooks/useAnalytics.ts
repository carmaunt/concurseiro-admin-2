import { useQuery } from '@tanstack/react-query';
import { obterAnalyticsDashboard, type AnalyticsFilters } from '@/services/analyticsService';

export function useAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', filters],
    queryFn: () => obterAnalyticsDashboard(filters),
    refetchInterval: 60_000,
  });
}
