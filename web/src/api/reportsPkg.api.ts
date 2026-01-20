import api from "./apiClient";
import { ReportCode, ReportFormat } from '@/types/reports.types';

/* ---------- METRICS ---------- */
export const getDashboardMetrics = async () => {
  try {
    const { data } = await api.get('/reports-pkg/metrics');
    return data;
  } catch (err) {
    console.error('Failed to fetch metrics:', err);
    return { occupancyRate: 0, vehicleUtilization: 0, staffEfficiency: 0, guestSatisfaction: 0 };
  }
};

/* ---------- CATALOG ---------- */
export const getReportCatalog = async () => {
  try {
    const { data } = await api.get('/reports-pkg/catalog');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to fetch catalog:', err);
    return [];
  }
};

/* ---------- PREVIEW ---------- */
export async function previewReport(params: {
  reportCode: ReportCode;
  fromDate?: string;
  toDate?: string;
}) {
  try {
    const { data } = await api.get('/reports-pkg/preview', { params });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Preview failed:', params.reportCode, err);
    return [];
  }
}

/* ---------- GENERATE ---------- */
export const generateReport = async (payload: {
  reportCode: ReportCode;
  format: ReportFormat;
  from?: string;
  to?: string;
}) => {
  try {
    const { data } = await api.post('/reports-pkg/generate', payload);
    return data;
  } catch (err) {
    console.error('Generate failed:', payload.reportCode, err);
    return { filePath: null };
  }
};

/* ---------- HISTORY ---------- */
export const getReportHistory = async () => {
  try {
    const { data } = await api.get('/reports-pkg/history');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to fetch history:', err);
    return [];
  }
};

