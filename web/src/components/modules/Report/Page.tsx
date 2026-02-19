import { useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import './Report.css';
// import { downloadGuestSummaryExcel, downloadGuestSummaryPdf, downloadRoomSummaryExcel, downloadRoomSummaryPdf, downloadVehicleDriverExcel, downloadVehicleDriverPdf, downloadFoodServiceExcel, downloadFoodServicePdf, downloadNetworkExcel, downloadNetworkPdf, downloadDriverDutyExcel, downloadDriverDutyPdf, viewReport } from '@/api/reportsPkg.api';
import { generateSectionReport } from '@/api/reportsPkg.api';

export function Reports() {
  const [globalRange, setGlobalRange] = useState('Today');
  const [language, setLanguage] = useState<'en' | 'mr'>('en');
  const [selectedSection, setSelectedSection] = useState<
    'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network'
  >('guest');

  const [exportFormat, setExportFormat] = useState<'PDF' | 'EXCEL' | 'VIEW'>('PDF');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewData, setViewData] = useState<any>(null);
  async function handleGlobalGenerate() {
    if (globalRange === 'Custom Range' && (!startDate || !endDate)) {
      alert('Please select start and end dates');
      return;
    }

    const response = await generateSectionReport({
      section: selectedSection,
      rangeType: globalRange,
      format: exportFormat,
      startDate: globalRange === 'Custom Range' ? startDate : undefined,
      endDate: globalRange === 'Custom Range' ? endDate : undefined,
      language,
    });
    console.log("VIEW RESPONSE:", response);

    if (exportFormat === 'VIEW') {
      setViewData(response);  // create state
    } else {
      setViewData(null);
    }
  }

  // Configuration for all report sections
  // const reportSections = [
  //   {
  //     id: 'guest',
  //     title: 'Guest Summary Report',
  //     category: 'Guest Reports',
  //     description: 'Daily, Weekly, Monthly guest statistics and occupancy analysis',
  //     icon: Users
  //   },
  //   {
  //     id: 'room',
  //     title: 'Room & Housekeeping Report',
  //     category: 'Room & Housekeeping Reports',
  //     description: 'Room utilization, occupancy trends, and housekeeping performance',
  //     icon: BedDouble
  //   },
  //   {
  //     id: 'vehicle',
  //     title: 'Vehicle & Driver Report',
  //     category: 'Vehicle & Driver Reports',
  //     description: 'Vehicle usage logs, fuel consumption, and driver duty records',
  //     icon: Car
  //   },
  //   {
  //     id: 'driver-duty',
  //     title: 'Driver Duty Report',
  //     category: 'Driver Duty Reports',
  //     description: 'Driver duty logs, fuel consumption, and driver duty records',
  //     icon: Car
  //   },
  //   {
  //     id: 'food',
  //     title: 'Food Service Report',
  //     category: 'Food Service Reports',
  //     description: 'Kitchen inventory, meal orders, and catering summaries',
  //     icon: Utensils
  //   },
  //   {
  //     id: 'network',
  //     title: 'Network Report',
  //     category: 'Network Reports',
  //     description: 'Wi-Fi usage, downtime logs, and bandwidth analysis',
  //     icon: Wifi
  //   }
  // ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[#00247D] text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-sm text-gray-600">रिपोर्ट और विश्लेषण - Generate comprehensive reports and analytics</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-blue-200 rounded-sm p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Occupancy Rate</p>
              <p className="text-3xl font-bold text-blue-600">70%</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-sm p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Vehicle Utilization</p>
              <p className="text-3xl font-bold text-green-600">53%</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-purple-200 rounded-sm p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Staff Efficiency</p>
              <p className="text-3xl font-bold text-purple-600">85%</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-orange-200 rounded-sm p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Guest Satisfaction</p>
              <p className="text-3xl font-bold text-orange-600">92%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Report Generator */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
        <h3 className="text-[#00247D] text-lg font-semibold mb-4 border-b pb-2 border-gray-100">Generate Custom Report</h3>
        <div className="reportFilters">
          <div className="reportType">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]"
            >
              <option value="guest">Guest Summary</option>
              <option value="room">Room Occupancy</option>
              <option value="vehicle">Vehicle Usage</option>
              <option value="driver-duty">Driver Duty</option>
              <option value="food">Food Service</option>
              <option value="network">Network</option>
            </select>

          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={globalRange}
              onChange={(e) => setGlobalRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'mr')}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]"
            >
              <option value="en">English</option>
              <option value="mr">Marathi</option>
            </select>
          </div>

          {globalRange === 'Custom Range' && (
            <div className="xl:col-span-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]"
            >
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel (XLSX)</option>
              <option value="VIEW">View</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleGlobalGenerate}
              className="primaryBtn generateBtn w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
        {viewData && (
          <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm">
            <h3 className="text-[#00247D] font-semibold mb-4">
              Preview Results ({viewData.totalRecords})
            </h3>

            {viewData.rows.length === 0 ? (
              <p className="text-sm text-gray-500">No data found for selected filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(viewData.rows[0]).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 border text-left font-medium text-gray-600"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewData.rows.map((row: any, index: number) => (
                      <tr key={index} className="border-t">
                        {Object.values(row).map((value: any, i: number) => (
                          <td key={i} className="px-3 py-2 border">
                            {String(value ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Available Reports - Consolidated Sections */}
      {/* <div className="space-y-6">
        {reportSections.map((section) => (
          <ReportSection key={section.id} section={section} language={language}/>
        ))}
      </div> */}

      {/* Recent Reports Table */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <h3 className="text-[#00247D] font-semibold">Recently Generated Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Monthly Guest Summary - November 2025</td>
                <td className="px-6 py-4 text-sm text-gray-700">Guest Report</td>
                <td className="px-6 py-4 text-sm text-gray-700">2025-12-01 10:30 AM</td>
                <td className="px-6 py-4 text-sm text-gray-700">Admin User</td>
                <td className="px-6 py-4">
                  <button className="text-[#00247D] hover:text-blue-900 text-sm font-medium flex items-center gap-1">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Vehicle Usage Report - Week 48</td>
                <td className="px-6 py-4 text-sm text-gray-700">Vehicle Report</td>
                <td className="px-6 py-4 text-sm text-gray-700">2025-12-03 02:15 PM</td>
                <td className="px-6 py-4 text-sm text-gray-700">Admin User</td>
                <td className="px-6 py-4">
                  <button className="text-[#00247D] hover:text-blue-900 text-sm font-medium flex items-center gap-1">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">Room Occupancy Trends - November</td>
                <td className="px-6 py-4 text-sm text-gray-700">Room Report</td>
                <td className="px-6 py-4 text-sm text-gray-700">2025-12-05 09:00 AM</td>
                <td className="px-6 py-4 text-sm text-gray-700">Admin User</td>
                <td className="px-6 py-4">
                  <button className="text-[#00247D] hover:text-blue-900 text-sm font-medium flex items-center gap-1">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
