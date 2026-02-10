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
/**
 * Guest Summary → Excel
 */
export async function downloadGuestSummaryExcel(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/guest-summary/excel',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Guest_Summary_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Guest Summary → PDF
 */
export async function downloadGuestSummaryPdf(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/guest-summary/pdf',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Guest_Summary_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Room & Housekeeping Summary → Excel
 */
export async function downloadRoomSummaryExcel(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/room-summary/excel',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Room_Housekeeping_Report_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Room & Housekeeping → PDF
 */
export async function downloadRoomSummaryPdf(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/room-summary/pdf',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Room_Housekeeping_Report_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Vehicle & Driver Transaction → Excel
 */
export async function downloadVehicleDriverExcel(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/vehicle-driver/excel',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Vehicle_Driver_Transactions_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Vehicle & Driver Transaction → PDF
 */
export async function downloadVehicleDriverPdf(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/vehicle-driver/pdf',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Vehicle_Driver_Transactions_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Food Service Transaction → Excel
 */
export async function downloadFoodServiceExcel(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/food-service/excel',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Food_Service_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Food Service Transaction → PDF
 */
export async function downloadFoodServicePdf(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/food-service/pdf',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Food_Service_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Network Transaction → Excel
 */
export async function downloadNetworkExcel(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/network/excel',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Network_Transactions_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Network Transaction → PDF
 */
export async function downloadNetworkPdf(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/network/pdf',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Network_Transactions_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Driver Duty → Excel
 */
export async function downloadDriverDutyExcel(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/driver-duty/excel',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Driver_Duty_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
/**
 * Driver Duty → PDF
 */
export async function downloadDriverDutyPdf(params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) {
  const response = await api.post(
    '/reports-pkg/driver-duty/pdf',
    params,
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: 'application/pdf',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Driver_Duty_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
