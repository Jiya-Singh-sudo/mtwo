import { useState } from 'react';
import { Download, FileText, Calendar, TrendingUp, Wifi, Utensils, Car, Users, BedDouble } from 'lucide-react';
import { downloadGuestSummaryExcel, downloadGuestSummaryPdf, downloadRoomSummaryExcel, downloadRoomSummaryPdf } from '@/api/reportsPkg.api';

export function Reports() {
  const [globalRange, setGlobalRange] = useState('Today');
 
  // Configuration for all report sections
  const reportSections = [
    {
      id: 'guest',
      title: 'Guest Summary Report',
      category: 'Guest Reports',
      description: 'Daily, Weekly, Monthly guest statistics and occupancy analysis',
      icon: Users
    },
    {
      id: 'room',
      title: 'Room & Housekeeping Report',
      category: 'Room & Housekeeping Reports',
      description: 'Room utilization, occupancy trends, and housekeeping performance',
      icon: BedDouble
    },
    {
      id: 'vehicle',
      title: 'Vehicle & Driver Report',
      category: 'Vehicle & Driver Reports',
      description: 'Vehicle usage logs, fuel consumption, and driver duty records',
      icon: Car
    },
    {
      id: 'driver-duty',
      title: 'Driver Duty Report',
      category: 'Driver Duty Reports',
      description: 'Driver duty logs, fuel consumption, and driver duty records',
      icon: Car
    },
    {
      id: 'food',
      title: 'Food Service Report',
      category: 'Food Service Reports',
      description: 'Kitchen inventory, meal orders, and catering summaries',
      icon: Utensils
    },
    {
      id: 'network',
      title: 'Network Report',
      category: 'Network Reports',
      description: 'Wi-Fi usage, downtime logs, and bandwidth analysis',
      icon: Wifi
    }
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]">
              <option>Guest Summary</option>
              <option>Room Occupancy</option>
              <option>Vehicle Usage</option>
              <option>Duty Performance</option>
              <option>Financial Summary</option>
            </select>
          </div>
         
          <div className="md:col-span-3">
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

          {globalRange === 'Custom Range' && (
            <div className="md:col-span-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]" />
              </div>
            </div>
          )}

          <div className={globalRange === 'Custom Range' ? "md:col-span-2" : "md:col-span-3"}>
             <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
             <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]">
               <option>PDF</option>
               <option>Excel (XLSX)</option>
               <option>CSV</option>
             </select>
          </div>

          <div className="md:col-span-3">
            <button className="w-full px-4 py-2 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 font-medium">
              <Download className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Available Reports - Consolidated Sections */}
      <div className="space-y-6">
        {reportSections.map((section) => (
          <ReportSection key={section.id} section={section} />
        ))}
      </div>

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

function ReportSection({ section }: { section: any }) {
  const [range, setRange] = useState('Daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  function handleDownload(
    format: 'PDF' | 'EXCEL',
    sectionId: string,
    range: string,
    startDate?: string,
    endDate?: string
  ) {
    if (range === 'Custom Range' && (!startDate || !endDate)) {
      alert('Please select start and end dates');
      return;
    }

    const payload = {
      rangeType: range,
      startDate: range === 'Custom Range' ? startDate : undefined,
      endDate: range === 'Custom Range' ? endDate : undefined,
    };

    // ---- Guest Reports ----
    if (sectionId === 'guest') {
      if (format === 'PDF') {
        downloadGuestSummaryPdf(payload);
      } else {
        downloadGuestSummaryExcel(payload);
      }
      return;
    }

    // ---- Room Reports ----
    if (sectionId === 'room') {
      if (format === 'EXCEL') {
        downloadRoomSummaryExcel(payload);
      }
      if (format === 'PDF') {
        downloadRoomSummaryPdf(payload);
      }
      return;
    }

    // ---- Future hooks ----
    // vehicle, food, network go here later
  }

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 flex items-center gap-3">
        <div className="p-2 bg-[#00247D] bg-opacity-10 rounded-sm">
          <section.icon className="w-5 h-5 text-[#00247D]" />
        </div>
        <div>
          <h3 className="text-[#00247D] font-semibold text-lg">{section.category}</h3>
          <p className="text-xs text-gray-500">Report Generation Module</p>
        </div>
      </div>
     
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          {/* Info Column */}
          <div className="md:col-span-12 lg:col-span-3">
             <h4 className="font-medium text-gray-900 mb-1">{section.title}</h4>
             <p className="text-sm text-gray-500">{section.description}</p>
          </div>

          {/* Controls Column */}
          <div className="md:col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
           
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Range Type</label>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom Range">Custom Range</option>
              </select>
            </div>

            {range === 'Custom Range' ? (
              <>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D] focus:ring-1 focus:ring-[#00247D]" />
                </div>
              </>
            ) : (
              // Spacer or alternative inputs for standard ranges could go here, but for now we keep it clean
              <div className="md:col-span-6 flex items-center text-sm text-gray-500 italic pb-3">
                {range === 'Daily' && 'Generates report for today'}
                {range === 'Weekly' && 'Generates report for current week'}
                {range === 'Monthly' && 'Generates report for current month'}
              </div>
            )}

            <div className="md:col-span-3 flex gap-2">
               <button 
                  className="flex-1 px-4 py-2 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  onClick={() =>
                    handleDownload('PDF', section.id, range, startDate, endDate)
                  }

                >
                 <Download className="w-4 h-4" />
                 PDF
               </button>
               <button 
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  onClick={() =>
                    handleDownload('EXCEL', section.id, range, startDate, endDate)
                  }
                  >
                 <FileText className="w-4 h-4" />
                 Excel
               </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
