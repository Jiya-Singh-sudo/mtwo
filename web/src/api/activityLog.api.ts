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
  const { data } = await api.get('/activity-log', { params });
  return data;
}
