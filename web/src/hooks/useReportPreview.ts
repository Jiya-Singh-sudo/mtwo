import { useState } from 'react';
import { previewReport } from '@/api/reportsPkg.api';
import { ReportPreviewParams } from '@/types/reports.types';

export function useReportPreview() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runPreview = async (params: ReportPreviewParams) => {
    setLoading(true);
    try {
      const res = await previewReport(params);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    runPreview,
  };
}
