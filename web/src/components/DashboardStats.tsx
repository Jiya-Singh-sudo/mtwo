import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Building2, 
  Car, 
  Calendar,
  Bell,
  AlertCircle 
} from 'lucide-react';

export function DashboardStats() {
  const stats = [
    {
      title: 'Total Guests',
      titleHi: 'कुल अतिथि',
      value: '45',
      change: '+3 today',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-200'
    },
    {
      title: 'Checked In',
      titleHi: 'चेक-इन',
      value: '28',
      change: 'Active',
      icon: UserCheck,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-200'
    },
    {
      title: 'Upcoming Arrivals',
      titleHi: 'आगामी आगमन',
      value: '12',
      change: 'Next 24hrs',
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
      border: 'border-orange-200'
    },
    {
      title: 'Checked Out',
      titleHi: 'चेक-आउट',
      value: '5',
      change: 'Today',
      icon: UserX,
      color: 'bg-gray-50 text-gray-600',
      border: 'border-gray-200'
    },
  ];

  const resourceStats = [
    {
      title: 'Room Occupancy',
      titleHi: 'कक्ष अधिभोग',
      available: 12,
      total: 40,
      occupied: 28,
      icon: Building2,
      status: [
        { label: 'Available', count: 12, color: 'bg-green-500' },
        { label: 'Occupied', count: 20, color: 'bg-red-500' },
        { label: 'Reserved', count: 5, color: 'bg-yellow-500' },
        { label: 'Maintenance', count: 3, color: 'bg-gray-500' },
      ]
    },
    {
      title: 'Vehicle Fleet',
      titleHi: 'वाहन बेड़ा',
      available: 8,
      total: 15,
      occupied: 7,
      icon: Car,
      status: [
        { label: 'Available', count: 8, color: 'bg-green-500' },
        { label: 'On Duty', count: 5, color: 'bg-blue-500' },
        { label: 'In Service', count: 2, color: 'bg-yellow-500' },
      ]
    },
    {
      title: 'Duty Roster',
      titleHi: 'ड्यूटी रोस्टर',
      available: 25,
      total: 35,
      occupied: 10,
      icon: Calendar,
      status: [
        { label: 'Active Duties', count: 18, color: 'bg-blue-500' },
        { label: 'Pending Approval', count: 5, color: 'bg-orange-500' },
        { label: 'Completed', count: 12, color: 'bg-green-500' },
      ]
    },
    {
      title: 'Notifications',
      titleHi: 'सूचनाएं',
      available: 8,
      total: 32,
      occupied: 24,
      icon: Bell,
      status: [
        { label: 'Sent Today', count: 24, color: 'bg-green-500' },
        { label: 'Pending', count: 8, color: 'bg-yellow-500' },
        { label: 'Failed', count: 0, color: 'bg-red-500' },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-[#00247D]">Dashboard Overview</h2>
        <p className="text-gray-600 text-sm mt-1">Real-time statistics and system status | वास्तविक समय के आंकड़े</p>
      </div>

      {/* Guest Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title}
              className={`bg-white border-2 ${stat.border} rounded-sm p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-xs text-gray-500">{stat.titleHi}</p>
                  <p className="text-3xl mt-2 text-[#00247D]">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-sm flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resource Management Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {resourceStats.map((resource) => {
          const Icon = resource.icon;
          const percentage = Math.round((resource.occupied / resource.total) * 100);
          
          return (
            <div key={resource.title} className="bg-white border border-gray-200 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00247D] bg-opacity-10 rounded-sm flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#00247D]" />
                    </div>
                    <div>
                      <h3 className="text-[#00247D]">{resource.title}</h3>
                      <p className="text-xs text-gray-500">{resource.titleHi}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl text-[#00247D]">{percentage}%</p>
                  <p className="text-xs text-gray-500">Utilization</p>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-2">
                {resource.status.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${item.color} rounded-full`} />
                      <span className="text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>Available: {resource.available}</span>
                  <span>Total: {resource.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#00247D] h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts & Warnings */}
      <div className="bg-orange-50 border-l-4 border-[#FF9933] p-4 rounded-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-orange-900">Attention Required | ध्यान देने योग्य</h4>
            <ul className="mt-2 space-y-1 text-sm text-orange-800">
              <li>• 3 VIP guests arriving tomorrow - rooms need confirmation</li>
              <li>• 2 vehicles scheduled for maintenance today</li>
              <li>• 5 duty rosters pending approval from Department Heads</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
