import api from "./apiClient";
import { ReportCode, ReportFormat } from '@/types/reports.types';

/* ---------- METRICS ---------- */
export const getDashboardMetrics = async () => {
  const { data } = await api.get('/reports-pkg/metrics');
  return data;
};

/* ---------- CATALOG ---------- */
export const getReportCatalog = async () => {
  const { data } = await api.get('/reports-pkg/catalog');
  return data;
};

/* ---------- PREVIEW ---------- */
// export const previewReport = async (params: {
//   reportCode: ReportCode;
//   from?: string;
//   to?: string;
// }) => {
//   const { data } = await api.get('/reports-pkg/preview', { params });
//   return data;
// };
export async function previewReport(params: {
  reportCode: ReportCode;
  fromDate?: string;
  toDate?: string;
}) {
  return api.get('/reports-pkg/preview', { params });
}

/* ---------- GENERATE ---------- */
export const generateReport = async (payload: {
  reportCode: ReportCode;
  format: ReportFormat;
  from?: string;
  to?: string;
}) => {
  const { data } = await api.post('/reports-pkg/generate', payload);
  return data; // { filePath }
};

/* ---------- HISTORY ---------- */
export const getReportHistory = async () => {
  const { data } = await api.get('/reports-pkg/history');
  return data;
};
