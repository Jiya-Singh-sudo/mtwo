import { UserPlus, Shield, Clock, ToggleLeft } from 'lucide-react';

export function UserManagement() {
  const users = [
    {
      id: 'U001',
      name: 'Admin User',
      email: 'admin@guesthouse.gov.in',
      role: 'Admin',
      department: 'Administration',
      status: 'Active',
      lastLogin: '2025-12-06 08:00 AM',
      permissions: ['All Modules']
    },
    {
      id: 'U002',
      name: 'Ramesh Kumar',
      email: 'ramesh.kumar@guesthouse.gov.in',
      role: 'Department Head',
      department: 'Housekeeping',
      status: 'Active',
      lastLogin: '2025-12-06 07:30 AM',
      permissions: ['Guest Management', 'Room Management', 'Duty Roster']
    },
    {
      id: 'U003',
      name: 'Priya Sharma',
      email: 'priya.sharma@guesthouse.gov.in',
      role: 'Officer',
      department: 'Front Desk',
      status: 'Active',
      lastLogin: '2025-12-05 06:00 PM',
      permissions: ['Guest Management', 'Room Management']
    },
    {
      id: 'U004',
      name: 'Vijay Singh',
      email: 'vijay.singh@guesthouse.gov.in',
      role: 'Staff',
      department: 'Security',
      status: 'Inactive',
      lastLogin: '2025-12-03 10:00 PM',
      permissions: ['View Only']
    },
  ];

  const roles = [
    { name: 'Admin', count: 2, color: 'bg-red-100 text-red-700' },
    { name: 'Department Head', count: 5, color: 'bg-orange-100 text-orange-700' },
    { name: 'Officer', count: 12, color: 'bg-blue-100 text-blue-700' },
    { name: 'Staff', count: 27, color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">User & Role Management</h2>
          <p className="text-sm text-gray-600">उपयोगकर्ता प्रबंधन - Manage users, roles, and permissions</p>
        </div>
        <button className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roles.map((role) => (
          <div key={role.name} className="bg-white border border-gray-200 rounded-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-[#00247D]" />
              <span className={`px-3 py-1 text-sm rounded-full ${role.color}`}>
                {role.count}
              </span>
            </div>
            <p className="text-gray-900">{role.name}</p>
            <p className="text-sm text-gray-600 mt-1">Active users</p>
          </div>
        ))}
      </div>

      {/* User List */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-[#00247D]">User List</h3>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#00247D]">
              <option>All Roles</option>
              <option>Admin</option>
              <option>Department Head</option>
              <option>Officer</option>
              <option>Staff</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#00247D]">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-700">User ID</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Name & Email</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Role</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Department</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Last Login</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      user.role === 'Admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'Department Head' ? 'bg-orange-100 text-orange-700' :
                      user.role === 'Officer' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.department}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      user.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {user.lastLogin}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                      <button className="text-orange-600 hover:text-orange-800 text-sm">Permissions</button>
                      <button className="text-red-600 hover:text-red-800 text-sm">Disable</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Role Permissions</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Select Role</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
                <option>Admin</option>
                <option>Department Head</option>
                <option>Officer</option>
                <option>Staff</option>
              </select>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-700">Module Access:</p>
              {[
                'Guest Management',
                'Room Management',
                'Vehicle Management',
                'Duty Roster',
                'Info Package Generator',
                'Notifications',
                'Reports & Analytics',
                'User Management',
                'System Settings'
              ].map((module, index) => (
                <label key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-sm hover:bg-gray-50">
                  <span className="text-sm text-gray-700">{module}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" defaultChecked className="rounded" />
                      View
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" defaultChecked className="rounded" />
                      Edit
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" className="rounded" />
                      Delete
                    </label>
                  </div>
                </label>
              ))}
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors">
              Save Permissions
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Login History */}
          <div className="bg-white border border-gray-200 rounded-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-[#00247D]">Recent Login Activity</h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                { user: 'Admin User', time: '2025-12-06 08:00 AM', ip: '10.0.0.1' },
                { user: 'Ramesh Kumar', time: '2025-12-06 07:30 AM', ip: '10.0.0.5' },
                { user: 'Priya Sharma', time: '2025-12-05 06:00 PM', ip: '10.0.0.12' },
              ].map((login, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-sm">
                  <div>
                    <p className="text-sm text-gray-900">{login.user}</p>
                    <p className="text-xs text-gray-500">{login.time}</p>
                  </div>
                  <p className="text-xs text-gray-600">IP: {login.ip}</p>
                </div>
              ))}
              <button className="w-full py-2 text-sm text-[#00247D] border border-[#00247D] rounded-sm hover:bg-blue-50 transition-colors">
                View Full History
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-sm p-6">
            <h3 className="text-[#00247D] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors text-sm">
                Bulk User Import
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors text-sm">
                Export User List
              </button>
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-sm hover:bg-orange-700 transition-colors text-sm">
                Reset Passwords
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
