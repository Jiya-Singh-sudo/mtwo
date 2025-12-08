import { Calendar, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function DutyRoster() {
  const roster = [
    {
      department: 'Housekeeping',
      officer: 'Ramesh Kumar',
      duty: 'Room Cleaning - Floor 1',
      time: '08:00 - 16:00',
      status: 'Active',
      approval: 'Approved'
    },
    {
      department: 'Security',
      officer: 'Vijay Singh',
      duty: 'Main Gate Security',
      time: '00:00 - 08:00',
      status: 'Active',
      approval: 'Approved'
    },
    {
      department: 'Kitchen',
      officer: 'Sita Devi',
      duty: 'Meal Preparation',
      time: '06:00 - 14:00',
      status: 'Active',
      approval: 'Approved'
    },
    {
      department: 'Front Desk',
      officer: 'Amit Sharma',
      duty: 'Guest Reception',
      time: '08:00 - 20:00',
      status: 'Pending',
      approval: 'Pending'
    },
  ];

  const departments = [
    { name: 'Housekeeping', staff: 12, active: 8, pending: 2 },
    { name: 'Security', staff: 15, active: 10, pending: 1 },
    { name: 'Kitchen', staff: 8, active: 6, pending: 0 },
    { name: 'Front Desk', staff: 6, active: 4, pending: 2 },
    { name: 'Maintenance', staff: 5, active: 3, pending: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Duty Roster Management</h2>
          <p className="text-sm text-gray-600">ड्यूटी रोस्टर प्रबंधन - Manage staff duties and schedules</p>
        </div>
        <button className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors">
          Create New Duty Roster
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-blue-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Active Duties</p>
              <p className="text-3xl text-blue-600">18</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-orange-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-10 h-10 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-3xl text-orange-600">5</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-3xl text-green-600">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-10 h-10 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-3xl text-gray-700">46</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Overview */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Department Overview</h3>
          </div>
          <div className="p-6 space-y-4">
            {departments.map((dept) => (
              <div key={dept.name} className="border border-gray-200 rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-900">{dept.name}</p>
                  <span className="text-sm text-gray-600">{dept.staff} staff</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Active</p>
                    <p className="text-blue-600">{dept.active}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pending</p>
                    <p className="text-orange-600">{dept.pending}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Duty Roster */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Today's Duty Roster</h3>
            <p className="text-sm text-gray-600 mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Department</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Officer Name</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Duty Details</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Time Slot</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-700">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roster.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.officer}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.duty}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {item.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        item.status === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        item.approval === 'Approved' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.approval}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Duty Builder */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-[#00247D] mb-4">Duty Roster Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Department</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>Select Department</option>
              <option>Housekeeping</option>
              <option>Security</option>
              <option>Kitchen</option>
              <option>Front Desk</option>
              <option>Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Officer</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>Select Officer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Time Slot</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>00:00 - 08:00</option>
              <option>08:00 - 16:00</option>
              <option>16:00 - 00:00</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">Action</label>
            <button className="w-full px-4 py-2 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors">
              Add to Roster
            </button>
          </div>
        </div>
      </div>

      {/* Approval Flow */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-sm">
        <h4 className="text-orange-900 mb-2">Pending Approvals</h4>
        <p className="text-sm text-orange-800">5 duty rosters are pending approval from Department Heads</p>
        <button className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-sm hover:bg-orange-700 transition-colors text-sm">
          Review Pending Approvals
        </button>
      </div>
    </div>
  );
}
