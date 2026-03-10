import api from '@/api/apiClient';
import type { ActivityLogResponse } from '@/types/activity-log';

export async function fetchActivityLogs(params: {
  module?: string;
  action?: string;
  performedBy?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<ActivityLogResponse> {
  const { data } = await api.get<ActivityLogResponse>('/activity-log', {
    params,
  });

  return data;
}
export async function getRecentActivity(limit = 6) {
  const res = await api.get('/activity-log', {
    params: { limit },
  });
  return res.data;
}