import { api } from '@/services/api';
import type { AnalyticsDashboard } from '@/types/api';

type AnalyticsDashboardParams = {
  from?: string;
  to?: string;
};

export async function buscarAnalyticsDashboard(params: AnalyticsDashboardParams = {}) {
  const response = await api.get('/api/v1/admin/analytics/dashboard', { params });
  return (response.data?.data ?? response.data) as AnalyticsDashboard;
}
