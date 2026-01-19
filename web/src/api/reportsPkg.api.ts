import api from "./apiClient"
import {
  ReportPreviewParams,
  ReportGeneratePayload,
  ReportJobResponse,
  DashboardMetrics,
} from '@/types/reports.types';

/* ================= CATALOG ================= */

export const getReportCatalog = async () => {
  const res = await api.get('/reports/catalog');
  return res.data;
};

/* ================= METRICS ================= */

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const res = await api.get('/reports/metrics');
  return res.data;
};

/* ================= PREVIEW ================= */

export const previewReport = async (
  params: ReportPreviewParams,
): Promise<any[]> => {
  const res = await api.get('/reports/preview', { params });
  return res.data;
};

/* ================= SYNC GENERATE ================= */

export const generateReport = async (
  payload: ReportGeneratePayload,
): Promise<{ success: boolean; filePath: string }> => {
  const res = await api.post('/reports/generate', payload);
  return res.data;
};

/* ================= ASYNC JOB GENERATE ================= */

export const createReportJob = async (
  payload: ReportGeneratePayload,
): Promise<{ jobId: string; status: string }> => {
  const res = await api.post('/reports/jobs', payload);
  return res.data;
};

export const getReportJobStatus = async (
  jobId: string,
): Promise<ReportJobResponse> => {
  const res = await api.get(`/reports/jobs/${jobId}`);
  return res.data;
};

/* ================= HISTORY ================= */

export const getReportHistory = async (): Promise<any[]> => {
  const res = await api.get('/reports/history');
  return res.data;
};
