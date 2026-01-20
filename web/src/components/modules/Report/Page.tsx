import { useEffect, useState } from 'react';
import { Download, FileText, TrendingUp, Eye } from 'lucide-react';
import {
  getDashboardMetrics,
  getReportCatalog,
  previewReport,
  generateReport,
  getReportHistory,
} from '@/api/reportsPkg.api';
import {
  ReportCode,
  ReportFormat,
  DashboardMetrics,
  GeneratedReport,
} from '@/types/reports.types';
import { ReportPreviewModal } from './ReportPreviewModal';
import { RoomOccupancyChart } from './charts/RoomOccupancyChart';
import { VehicleUsageChart } from './charts/VehicleUsageChart';
import { TrendLineChart } from './charts/TrendLineChart';
import { getDateRange } from '@/utils/dateRange';

export function Reports() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [roomChart, setRoomChart] = useState<any[]>([]);
  const [vehicleChart, setVehicleChart] = useState<any[]>([]);
  const [roomTrend, setRoomTrend] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState('Today');

  /* ---------- LOAD INITIAL DATA ---------- */
  useEffect(() => {
    (async () => {
      const [m, c, h] = await Promise.all([
        getDashboardMetrics(),
        getReportCatalog(),
        getReportHistory(),
      ]);
      setMetrics(m);
      setCatalog(c);
      setHistory(h);
    })();
  }, []);

  /* ---------- LOAD CHARTS (date-aware) ---------- */
  async function loadCharts() {
    const { fromDate, toDate } = getDateRange(dateRange);

    const [rooms, vehicles] = await Promise.all([
      previewReport({
        reportCode: ReportCode.ROOM_OCCUPANCY,
        fromDate,
        toDate,
      }),
      previewReport({
        reportCode: ReportCode.VEHICLE_USAGE,
        fromDate,
        toDate,
      }),
    ]);

    setRoomChart(Array.isArray(rooms) ? rooms : []);
    setVehicleChart(Array.isArray(vehicles) ? vehicles : []);
  }

  useEffect(() => {
    loadCharts();
    loadTrends();
  }, [dateRange]);

  /* ---------- LOAD TRENDS ---------- */
  async function loadTrends() {
    const { fromDate, toDate } = getDateRange(dateRange);

    const data = await previewReport({
      reportCode: ReportCode.ROOM_OCCUPANCY_TREND,
      fromDate,
      toDate,
    });

    setRoomTrend(Array.isArray(data) ? data : []);
  }

  /* ---------- ACTIONS ---------- */
  async function handlePreview(code: ReportCode, title: string) {
    const { fromDate, toDate } = getDateRange(dateRange);
    const data = await previewReport({ reportCode: code, fromDate, toDate });
    setPreviewTitle(title);
    setPreviewData(Array.isArray(data) ? data : []);
    setPreviewOpen(true);
  }

  async function handleGenerate(code: ReportCode, format: ReportFormat) {
    const { filePath } = await generateReport({ reportCode: code, format });
    if (filePath) window.open(filePath);
    setHistory(await getReportHistory());
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-[#00247D]">Reports & Analytics</h2>
        <p className="text-sm text-gray-600">
          रिपोर्ट और विश्लेषण - Generate comprehensive reports and analytics
        </p>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Occupancy Rate" value={`${metrics?.occupancyRate ?? 0}%`} color="blue" />
        <Stat label="Vehicle Utilization" value={`${metrics?.vehicleUtilization ?? 0}%`} color="green" />
        <Stat label="Staff Efficiency" value={`${metrics?.staffEfficiency ?? 0}%`} color="purple" />
        <Stat label="Guest Satisfaction" value={`${metrics?.guestSatisfaction ?? 0}%`} color="orange" />
      </div>

      {/* DATE FILTER */}
      <div className="flex gap-2">
        {['Today', 'This Week', 'This Month'].map((r) => (
          <button
            key={r}
            className={`px-4 py-2 border rounded-sm transition-colors ${dateRange === r
              ? 'bg-[#00247D] text-white border-[#00247D]'
              : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setDateRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RoomOccupancyChart data={roomChart} />
        <VehicleUsageChart data={vehicleChart} />
      </div>

      {/* TREND CHART */}
      <div className="bg-white border rounded-sm p-6">
        <h3 className="text-[#00247D] mb-4">Room Occupancy Trend</h3>
        <TrendLineChart data={roomTrend} label="Rooms Occupied" />
      </div>
      {/* REPORT CATALOG */}
      {Array.isArray(catalog) && catalog.map((section, i) => (
        <div key={i} className="bg-white border rounded-sm">
          <div className="border-b px-6 py-4 bg-gray-50">
            <h3 className="text-[#00247D]">{section.category}</h3>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(section.reports) && section.reports.map((r: any) => (
              <div key={r.code} className="border rounded-sm p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-[#00247D]/10 flex items-center justify-center rounded-sm">
                    <FileText className="text-[#00247D]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-sm text-gray-600 mb-3">{r.description}</p>

                    <div className="flex gap-2">
                      <button
                        className="bg-[#00247D] text-white px-3 py-1.5 rounded-sm text-sm"
                        onClick={() => handleGenerate(r.code, ReportFormat.PDF)}
                      >
                        <Download size={12} /> PDF
                      </button>

                      <button
                        className="bg-green-600 text-white px-3 py-1.5 rounded-sm text-sm"
                        onClick={() => handleGenerate(r.code, ReportFormat.EXCEL)}
                      >
                        <Download size={12} /> Excel
                      </button>

                      <button
                        className="border px-3 py-1.5 rounded-sm text-sm"
                        onClick={() => handlePreview(r.code, r.title)}
                      >
                        <Eye size={12} /> View
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
              <th className="px-6 py-3 text-left">Report Name</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Generated On</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(history) && history.map((r) => (
              <tr key={r.report_id} className="border-t">
                <td className="px-6 py-3">{r.report_name}</td>
                <td className="px-6 py-3">{r.report_type}</td>
                <td className="px-6 py-3">
                  {new Date(r.generated_at).toLocaleString()}
                </td>
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

      <ReportPreviewModal
        open={previewOpen}
        title={previewTitle}
        data={previewData}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

/* ---------- STAT CARD ---------- */
function Stat({ label, value, color }: any) {
  const colors: any = {
    blue: 'text-blue-600 border-blue-200',
    green: 'text-green-600 border-green-200',
    purple: 'text-purple-600 border-purple-200',
    orange: 'text-orange-600 border-orange-200',
  };

  return (
    <div className={`bg-white border-2 ${colors[color]} rounded-sm p-6`}>
      <div className="flex items-center gap-3">
        <TrendingUp className={colors[color].split(' ')[0]} />
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-3xl ${colors[color].split(' ')[0]}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}