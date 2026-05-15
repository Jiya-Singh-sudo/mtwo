import api from '@/api/apiClient';
import {
  ReportCode,
  ReportFormat,
  DashboardMetrics,
  GeneratedReport,
  ReportJobResponse,
} from '@/types/reports.types';

export async function generateSectionReport(params: {
  section: 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network' | 'officer';
  rangeType: string;
  format: 'PDF' | 'EXCEL' | 'VIEW';
  startDate?: string;
  endDate?: string;
  language?: 'en' | 'mr';
}) {
  try {
    const response = await api.post(
      '/reports-pkg/generate',
      params,
      params.format === 'VIEW'
        ? {} // ✅ NEVER use undefined
        : { responseType: 'blob' }
    );

    // ✅ VIEW → return data
    if (params.format === 'VIEW') {
      return response.data;
    }

    // ✅ FILE DOWNLOAD
    const blob = new Blob([response.data], {
      type:
        params.format === 'PDF'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${params.section}_${Date.now()}.${
      params.format === 'PDF' ? 'pdf' : 'xlsx'
    }`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true; // ✅ IMPORTANT (prevents undefined)
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
}

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

export async function getReportJobStatus(jobId: string): Promise<ReportJobResponse> {
  const { data } = await api.get(`/reports-pkg/jobs/${jobId}`);
  return data;
}

/**
 * Generic View Report
 */
export async function viewReport(params: {
  section: 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network';
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.post('/reports-pkg/view', params);
  return data;
}

