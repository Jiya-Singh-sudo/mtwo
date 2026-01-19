import { useEffect, useState } from 'react';
import { Download, FileText, TrendingUp, Eye, Loader2 } from 'lucide-react';
import { ReportPreviewModal } from './ReportPreviewModal';

import {
  getDashboardMetrics,
  getReportCatalog,
  previewReport,
  createReportJob,
  getReportJobStatus,
  getReportHistory,
} from '@/api/reportsPkg.api';

import {
  ReportCode,
  ReportFormat,
  DashboardMetrics,
} from '@/types/reports.types';

import { REPORT_ACCESS, UserRole } from '@/constants/reportAccess';

/* ---------- ACCESS CONTROL ---------- */
function canAccessReport(role: UserRole, reportCode: ReportCode) {
  return REPORT_ACCESS[role]?.includes(reportCode);
}

/* ---------- DATE HELPERS ---------- */
function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPresetRange(type: string) {
  const today = new Date();

  switch (type) {
    case 'TODAY':
      return {
        start: formatDate(today),
        end: formatDate(today),
      };

    case 'THIS_WEEK': {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return {
        start: formatDate(start),
        end: formatDate(today),
      };
    }

    case 'THIS_MONTH': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: formatDate(start),
        end: formatDate(today),
      };
    }

    case 'LAST_MONTH': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: formatDate(start),
        end: formatDate(end),
      };
    }

    default:
      return { start: '', end: '' };
  }
}

export function Reports() {
  // TEMP: replace with auth context / redux later
  const currentUserRole: UserRole = 'ADMIN';

  /* ---------------- STATE ---------------- */
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewReportCode, setPreviewReportCode] =
    useState<ReportCode | null>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  /* LOADING FLAGS */
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  /* DATE RANGE */
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  /* ---------------- LOAD INITIAL DATA ---------------- */
  useEffect(() => {
    // async function load() {
    //   const [m, h, c] = await Promise.all([
    //     getDashboardMetrics(),
    //     getReportHistory(),
    //     getReportCatalog(),
    //   ]);
    //   setMetrics(m);
    //   setRecentReports(h);
    //   setCatalog(c);
    // }
    // load();
  }, []);

  /* ---------------- JOB POLLING ---------------- */
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      const status = await getReportJobStatus(activeJobId);

      if (status.status === 'COMPLETED') {
        clearInterval(interval);
        window.open(status.file_path);
        setActiveJobId(null);
        setExportLoading(false);
      }

      if (status.status === 'FAILED') {
        clearInterval(interval);
        alert(status.error_message || 'Report generation failed');
        setActiveJobId(null);
        setExportLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  /* ---------------- ACTIONS ---------------- */
  async function viewReport(code: ReportCode, title: string) {
    setPreviewLoading(true);

    try {
      const data = await previewReport({
        reportCode: code,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setPreviewData(data);
      setPreviewTitle(title);
      setPreviewReportCode(code);
      setPreviewOpen(true);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function generateReport(code: ReportCode, format: ReportFormat) {
    if (exportLoading) return;

    setExportLoading(true);

    const { jobId } = await createReportJob({
      reportCode: code,
      format,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    setActiveJobId(jobId);
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-[#00247D]">Reports & Analytics</h2>
        <p className="text-sm text-gray-600">
          रिपोर्ट और विश्लेषण - Generate comprehensive reports
        </p>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Occupancy Rate" value={`${metrics?.occupancyRate ?? 0}%`} color="blue" />
        <Stat label="Vehicle Utilization" value={`${metrics?.vehicleUtilization ?? 0}%`} color="green" />
        <Stat label="Staff Efficiency" value={`${metrics?.staffEfficiency ?? 0}%`} color="purple" />
        <Stat label="Guest Satisfaction" value={`${metrics?.guestSatisfaction ?? 0}%`} color="orange" />
      </div>

      {/* DATE RANGE */}
      <div className="bg-white border rounded-sm p-4 space-y-3">
        {/* PRESETS */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Today', key: 'TODAY' },
            { label: 'This Week', key: 'THIS_WEEK' },
            { label: 'This Month', key: 'THIS_MONTH' },
            { label: 'Last Month', key: 'LAST_MONTH' },
          ].map((p) => (
            <button
              key={p.key}
              className="border px-3 py-1.5 rounded-sm text-sm"
              onClick={() => {
                const { start, end } = getPresetRange(p.key);
                setStartDate(start);
                setEndDate(end);
              }}
            >
              {p.label}
            </button>
          ))}

          <button
            className="border px-3 py-1.5 rounded-sm text-sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Reset
          </button>
        </div>

        {/* MANUAL PICKERS */}
        <div className="flex gap-4">
          <div>
            <label className="text-sm text-gray-600">From</label>
            <input
              type="date"
              className="border px-3 py-2 rounded-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">To</label>
            <input
              type="date"
              className="border px-3 py-2 rounded-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* EXPORT STATUS */}
      {exportLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="animate-spin" size={16} />
          Generating report, please wait…
        </div>
      )}

      {/* AVAILABLE REPORTS */}
      {catalog
        .map((section: any) => ({
          ...section,
          reports: section.reports.filter((r: any) =>
            canAccessReport(currentUserRole, r.code),
          ),
        }))
        .filter((section: any) => section.reports.length > 0)
        .map((section: any) => (
          <div key={section.section} className="bg-white border rounded-sm">
            <div className="border-b px-6 py-4 bg-gray-50">
              <h3 className="text-[#00247D]">{section.section}</h3>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.reports.map((r: any) => (
                <div key={r.code} className="border rounded-sm p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-[#00247D]/10 flex items-center justify-center rounded-sm">
                      <FileText className="text-[#00247D]" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-sm text-gray-600 mb-3">
                        {r.description}
                      </p>

                      <div className="flex gap-2">
                        <button
                          disabled={exportLoading}
                          className="bg-[#00247D] disabled:opacity-50 text-white px-3 py-1.5 rounded-sm text-sm flex items-center gap-1"
                          onClick={() => generateReport(r.code, ReportFormat.PDF)}
                        >
                          <Download size={12} /> PDF
                        </button>

                        <button
                          disabled={exportLoading}
                          className="bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-sm text-sm flex items-center gap-1"
                          onClick={() => generateReport(r.code, ReportFormat.EXCEL)}
                        >
                          <Download size={12} /> Excel
                        </button>

                        <button
                          disabled={previewLoading}
                          className="border disabled:opacity-50 px-3 py-1.5 rounded-sm text-sm flex items-center gap-1"
                          onClick={() => viewReport(r.code, r.title)}
                        >
                          {previewLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Eye size={12} />
                          )}
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* HISTORY */}
      <div className="bg-white border rounded-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-[#00247D]">Recently Generated Reports</h3>
        </div>

        <table className="w-full">
          <thead className="bg-[#F5A623] text-white">
            <tr>
              <th className="px-6 py-3 text-left">Report</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Generated On</th>
              <th className="px-6 py-3 text-left">By</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {recentReports.map((r) => (
              <tr key={r.report_id} className="border-t">
                <td className="px-6 py-3">{r.report_name}</td>
                <td className="px-6 py-3">{r.report_type}</td>
                <td className="px-6 py-3">
                  {new Date(r.generated_at).toLocaleString()}
                </td>
                <td className="px-6 py-3">{r.generated_by ?? '-'}</td>
                <td className="px-6 py-3">
                  <button
                    className="text-blue-600"
                    onClick={() => window.open(r.file_path)}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PREVIEW MODAL */}
      <ReportPreviewModal
        open={previewOpen}
        title={previewTitle}
        data={previewData}
        reportCode={previewReportCode}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

/* ---------- STAT CARD ---------- */
function Stat({ label, value, color }: any) {
  const map: any = {
    blue: 'text-blue-600 border-blue-200',
    green: 'text-green-600 border-green-200',
    purple: 'text-purple-600 border-purple-200',
    orange: 'text-orange-600 border-orange-200',
  };

  return (
    <div className={`bg-white border-2 ${map[color]} rounded-sm p-6`}>
      <div className="flex items-center gap-3">
        <TrendingUp className={map[color].split(' ')[0]} />
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-3xl ${map[color].split(' ')[0]}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}