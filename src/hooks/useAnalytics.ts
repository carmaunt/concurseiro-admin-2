import { useQuery } from '@tanstack/react-query';
import { buscarAnalyticsDashboard } from '@/services/analyticsService';

export type AnalyticsPeriod = 'today' | '7d' | '30d';

type AnalyticsRange = {
  from: string;
  to: string;
};

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (range: AnalyticsRange) => [...analyticsKeys.all, 'dashboard', range] as const,
};

export function resolveAnalyticsRange(period: AnalyticsPeriod): AnalyticsRange {
  const to = new Date();
  const from = new Date(to);

  if (period === 'today') {
    from.setHours(0, 0, 0, 0);
  }

  if (period === '7d') {
    from.setDate(from.getDate() - 7);
  }

  if (period === '30d') {
    from.setDate(from.getDate() - 30);
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function useAnalyticsDashboard(period: AnalyticsPeriod) {
  const range = resolveAnalyticsRange(period);

  return useQuery({
    queryKey: analyticsKeys.dashboard(range),
    queryFn: () => buscarAnalyticsDashboard(range),
    refetchInterval: 60_000,
  });
}
