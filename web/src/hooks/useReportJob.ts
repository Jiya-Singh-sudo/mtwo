import { useEffect, useState } from 'react';
import { getReportJobStatus } from '@/api/reportsPkg.api';
import { ReportJobResponse } from '@/types/reports.types';

export function useReportJob(jobId?: string) {
  const [job, setJob] = useState<ReportJobResponse | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      const status = await getReportJobStatus(jobId);
      setJob(status);

      if (
        status.status === 'COMPLETED' ||
        status.status === 'FAILED'
      ) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  return job;
}
