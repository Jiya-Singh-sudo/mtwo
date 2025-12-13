import { useState } from 'react';
import { Download, FileText, TrendingUp, Eye } from 'lucide-react';

interface GeneratedReport {
  name: string;
  type: string;
  generatedOn: string;
  generatedBy: string;
}

export function Reports() {
  /* ---------------- STATE ---------------- */
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([
    {
      name: 'Monthly Guest Summary - November 2025',
      type: 'Guest Report',
      generatedOn: '2025-12-01 10:30 AM',
      generatedBy: 'Admin User',
    },
    {
      name: 'Vehicle Usage Report - Week 48',
      type: 'Vehicle Report',
      generatedOn: '2025-12-03 02:15 PM',
      generatedBy: 'Admin User',
    },
    {
      name: 'Room Occupancy Trends - November',
      type: 'Room Report',
      generatedOn: '2025-12-05 09:00 AM',
      generatedBy: 'Admin User',
    },
  ]);

  const [generator, setGenerator] = useState({
    reportType: 'Guest Summary',
    dateRange: 'Today',
    format: 'PDF',
  });

  /* ---------------- HELPERS ---------------- */
  function now() {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }

  function mockDownload(name: string, format: string) {
    alert(`Downloading "${name}" as ${format}`);
  }

  function mockView(name: string) {
    alert(`Opening preview for "${name}"`);
  }

  /* ---------------- ACTIONS ---------------- */
  function generateCustomReport() {
    const reportName = `${generator.reportType} - ${generator.dateRange}`;
    setRecentReports((prev) => [
      {
        name: reportName,
        type: generator.reportType,
        generatedOn: now(),
        generatedBy: 'Admin User',
      },
      ...prev,
    ]);

    alert(`Report generated successfully (${generator.format})`);
  }

  /* ---------------- REPORT DEFINITIONS ---------------- */
  const reports = [
    {
      category: 'Guest Reports',
      items: [
        { name: 'Daily Guest Summary', description: 'Check-ins, Check-outs, and Current Occupancy' },
        { name: 'Weekly Guest Report', description: 'Week-wise guest statistics and trends' },
        { name: 'Monthly Guest Report', description: 'Monthly visitor analysis by department' },
        { name: 'Guest Category Analysis', description: 'VVIP, VIP, and Official guest breakdown' },
      ],
    },
    {
      category: 'Room Reports',
      items: [
        { name: 'Room Occupancy Trends', description: 'Daily, weekly, and monthly occupancy rates' },
        { name: 'Room Utilization Report', description: 'Room-wise usage statistics' },
        { name: 'Housekeeping Performance', description: 'Cleaning schedules and completion rates' },
        { name: 'Maintenance Log Report', description: 'Repairs and maintenance history' },
      ],
    },
    {
      category: 'Vehicle Reports',
      items: [
        { name: 'Vehicle Usage Report', description: 'Fleet utilization and trip statistics' },
        { name: 'Driver Performance Report', description: 'Driver duty hours and assignments' },
        { name: 'Fuel & Maintenance Report', description: 'Vehicle service and expense tracking' },
      ],
    },
    {
      category: 'Staff Reports',
      items: [
        { name: 'Duty Performance Report', description: 'Staff duty completion and compliance' },
        { name: 'Department Workload', description: 'Department-wise task distribution' },
        { name: 'Staff Response Time', description: 'Average response time analysis' },
      ],
    },
    {
      category: 'Notification Reports',
      items: [
        { name: 'Notification Logs', description: 'Sent, delivered, and failed notifications' },
        { name: 'Communication Analytics', description: 'Channel-wise communication statistics' },
      ],
    },
  ];

  /* ======================================================
     UI
====================================================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-[#00247D]">Reports & Analytics</h2>
        <p className="text-sm text-gray-600">
          रिपोर्ट और विश्लेषण - Generate comprehensive reports and analytics
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Occupancy Rate" value="70%" color="blue" />
        <Stat label="Vehicle Utilization" value="53%" color="green" />
        <Stat label="Staff Efficiency" value="85%" color="purple" />
        <Stat label="Guest Satisfaction" value="92%" color="orange" />
      </div>

      {/* REPORT GENERATOR */}
      <div className="bg-white border rounded-sm p-6">
        <h3 className="text-[#00247D] mb-4">Generate Custom Report</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            className="border px-4 py-2 rounded-sm"
            value={generator.reportType}
            onChange={(e) =>
              setGenerator({ ...generator, reportType: e.target.value })
            }
          >
            <option>Guest Summary</option>
            <option>Room Occupancy</option>
            <option>Vehicle Usage</option>
            <option>Duty Performance</option>
            <option>Financial Summary</option>
          </select>

          <select
            className="border px-4 py-2 rounded-sm"
            value={generator.dateRange}
            onChange={(e) =>
              setGenerator({ ...generator, dateRange: e.target.value })
            }
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Last Month</option>
          </select>

          <select
            className="border px-4 py-2 rounded-sm"
            value={generator.format}
            onChange={(e) =>
              setGenerator({ ...generator, format: e.target.value })
            }
          >
            <option>PDF</option>
            <option>Excel</option>
            <option>CSV</option>
          </select>

          <button
            className="bg-[#00247D] text-white rounded-sm flex items-center justify-center gap-2"
            onClick={generateCustomReport}
          >
            <Download size={16} />
            Generate
          </button>
        </div>
      </div>

      {/* AVAILABLE REPORTS */}
      {reports.map((section, i) => (
        <div key={i} className="bg-white border rounded-sm">
          <div className="border-b px-6 py-4 bg-gray-50">
            <h3 className="text-[#00247D]">{section.category}</h3>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map((r, idx) => (
              <div key={idx} className="border rounded-sm p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-[#00247D]/10 flex items-center justify-center rounded-sm">
                    <FileText className="text-[#00247D]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      {r.description}
                    </p>

                    <div className="flex gap-2">
                      <button
                        className="bg-[#00247D] text-white px-3 py-1.5 rounded-sm text-sm flex items-center gap-1"
                        onClick={() => mockDownload(r.name, 'PDF')}
                      >
                        <Download size={12} /> PDF
                      </button>

                      <button
                        className="bg-green-600 text-white px-3 py-1.5 rounded-sm text-sm flex items-center gap-1"
                        onClick={() => mockDownload(r.name, 'Excel')}
                      >
                        <Download size={12} /> Excel
                      </button>

                      <button
                        className="border px-3 py-1.5 rounded-sm text-sm flex items-center gap-1"
                        onClick={() => mockView(r.name)}
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

      {/* RECENT REPORTS */}
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
              <th className="px-6 py-3 text-left">Generated By</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentReports.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-6 py-3">{r.name}</td>
                <td className="px-6 py-3">{r.type}</td>
                <td className="px-6 py-3">{r.generatedOn}</td>
                <td className="px-6 py-3">{r.generatedBy}</td>
                <td className="px-6 py-3">
                  <button
                    className="text-blue-600"
                    onClick={() => mockDownload(r.name, 'PDF')}
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- SMALL STAT CARD ---------- */
function Stat({ label, value, color }: any) {
  return (
    <div className={`bg-white border-2 border-${color}-200 rounded-sm p-6`}>
      <div className="flex items-center gap-3">
        <TrendingUp className={`text-${color}-600`} />
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-3xl text-${color}-600`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
