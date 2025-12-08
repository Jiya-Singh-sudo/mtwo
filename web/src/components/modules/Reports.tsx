import { Download, FileText, Calendar, TrendingUp } from 'lucide-react';

export function Reports() {
  const reports = [
    {
      category: 'Guest Reports',
      items: [
        { name: 'Daily Guest Summary', description: 'Check-ins, Check-outs, and Current Occupancy' },
        { name: 'Weekly Guest Report', description: 'Week-wise guest statistics and trends' },
        { name: 'Monthly Guest Report', description: 'Monthly visitor analysis by department' },
        { name: 'Guest Category Analysis', description: 'VVIP, VIP, and Official guest breakdown' },
      ]
    },
    {
      category: 'Room Reports',
      items: [
        { name: 'Room Occupancy Trends', description: 'Daily, weekly, and monthly occupancy rates' },
        { name: 'Room Utilization Report', description: 'Room-wise usage statistics' },
        { name: 'Housekeeping Performance', description: 'Cleaning schedules and completion rates' },
        { name: 'Maintenance Log Report', description: 'Repairs and maintenance history' },
      ]
    },
    {
      category: 'Vehicle Reports',
      items: [
        { name: 'Vehicle Usage Report', description: 'Fleet utilization and trip statistics' },
        { name: 'Driver Performance Report', description: 'Driver duty hours and assignments' },
        { name: 'Fuel & Maintenance Report', description: 'Vehicle service and expense tracking' },
      ]
    },
    {
      category: 'Staff Reports',
      items: [
        { name: 'Duty Performance Report', description: 'Staff duty completion and compliance' },
        { name: 'Department Workload', description: 'Department-wise task distribution' },
        { name: 'Staff Response Time', description: 'Average response time analysis' },
      ]
    },
    {
      category: 'Notification Reports',
      items: [
        { name: 'Notification Logs', description: 'Sent, delivered, and failed notifications' },
        { name: 'Communication Analytics', description: 'Channel-wise communication statistics' },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[#00247D]">Reports & Analytics</h2>
        <p className="text-sm text-gray-600">रिपोर्ट और विश्लेषण - Generate comprehensive reports and analytics</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-blue-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-3xl text-blue-600">70%</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Vehicle Utilization</p>
              <p className="text-3xl text-green-600">53%</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-purple-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Staff Efficiency</p>
              <p className="text-3xl text-purple-600">85%</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-orange-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Guest Satisfaction</p>
              <p className="text-3xl text-orange-600">92%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generator */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-[#00247D] mb-4">Generate Custom Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Report Type</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>Guest Summary</option>
              <option>Room Occupancy</option>
              <option>Vehicle Usage</option>
              <option>Duty Performance</option>
              <option>Financial Summary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Date Range</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Export Format</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>PDF</option>
              <option>Excel (XLSX)</option>
              <option>CSV</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Action</label>
            <button className="w-full px-4 py-2 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Available Reports */}
      <div className="space-y-4">
        {reports.map((reportCategory, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-sm">
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <h3 className="text-[#00247D]">{reportCategory.category}</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportCategory.items.map((report, reportIndex) => (
                  <div key={reportIndex} className="border border-gray-200 rounded-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#00247D] bg-opacity-10 rounded-sm flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#00247D]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-gray-900 mb-1">{report.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors text-sm flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                          <button className="px-3 py-1.5 bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors text-sm flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            Excel
                          </button>
                          <button className="px-3 py-1.5 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors text-sm">
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Recently Generated Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Report Name</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Generated On</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Generated By</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Monthly Guest Summary - November 2025</td>
                <td className="px-6 py-4 text-sm text-gray-700">Guest Report</td>
                <td className="px-6 py-4 text-sm text-gray-700">2025-12-01 10:30 AM</td>
                <td className="px-6 py-4 text-sm text-gray-700">Admin User</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Vehicle Usage Report - Week 48</td>
                <td className="px-6 py-4 text-sm text-gray-700">Vehicle Report</td>
                <td className="px-6 py-4 text-sm text-gray-700">2025-12-03 02:15 PM</td>
                <td className="px-6 py-4 text-sm text-gray-700">Admin User</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">Room Occupancy Trends - November</td>
                <td className="px-6 py-4 text-sm text-gray-700">Room Report</td>
                <td className="px-6 py-4 text-sm text-gray-700">2025-12-05 09:00 AM</td>
                <td className="px-6 py-4 text-sm text-gray-700">Admin User</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
