import api from '@/api/apiClient';
import {
  ReportCode,
  ReportFormat,
  DashboardMetrics,
  GeneratedReport,
} from '@/types/reports.types';

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await api.get('/reports-pkg/metrics');
  return data;
}

export async function getReportCatalog() {
  const { data } = await api.get('/reports-pkg/catalog');
  return data;
}

export async function previewReport(params: {
  reportCode: ReportCode;
  fromDate?: string;
  toDate?: string;
}) {
  const { data } = await api.get('/reports-pkg/preview', { params });
  return data;
}

export async function generateReport(params: {
  reportCode: ReportCode;
  format: ReportFormat;
  fromDate?: string;
  toDate?: string;
}) {
  const { data } = await api.post('/reports-pkg/generate', params);
  return data;
}

export async function getReportHistory(): Promise<GeneratedReport[]> {
  const { data } = await api.get('/reports-pkg/history');
  return data;
}
