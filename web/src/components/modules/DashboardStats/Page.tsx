import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Building2,
  Car,
  Calendar,
  Bell,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { getDashboardOverview } from '../../../api/dashboard.api';
import { DashboardOverview } from '../../../types/dashboard';
import { useEffect, useState } from 'react';

export function DashboardStats() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getDashboardOverview();
      setOverview(data);
    }
    load();
  }, []);

  const stats = [
    {
      title: 'Total Guests',
      titleHi: 'कुल अतिथि',
      value: overview?.guests.total ?? 0,
      change: '',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-blue-200',
      path: '/guests'
    },
    {
      title: 'Checked In',
      titleHi: 'चेक-इन',
      value: overview?.guests.checkedIn ?? 0,
      change: 'Active',
      icon: UserCheck,
      color: 'bg-green-50 text-green-600',
      border: 'border-green-200',
      path: '/guests?status=checked-in'
    },
    {
      title: 'Upcoming Arrivals',
      titleHi: 'आगामी आगमन',
      value: overview?.guests.upcomingArrivals ?? 0,
      change: 'Next 24hrs',
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
      border: 'border-orange-200',
      path: '/guests?filter=upcoming'
    },
    {
      title: 'Checked Out',
      titleHi: 'चेक-आउट',
      value: overview?.guests.checkedOutToday ?? 0,
      change: 'Today',
      icon: UserX,
      color: 'bg-gray-50 text-gray-600',
      border: 'border-gray-200',
      path: '/guests?status=checked-out'
    }
  ];

  const resourceStats = [
    {
      title: 'Room Occupancy',
      titleHi: 'कक्ष अधिभोग',
      total: 40,
      occupied: 28,
      icon: Building2,
      path: '/rooms'
    },
    {
      title: 'Vehicle Fleet',
      titleHi: 'वाहन बेड़ा',
      total: 15,
      occupied: 7,
      icon: Car,
      path: '/vehicles'
    },
    {
      title: 'Duty Roster',
      titleHi: 'ड्यूटी रोस्टर',
      total: 35,
      occupied: 10,
      icon: Calendar,
      path: '/duty-roster'
    },
    {
      title: 'Notifications',
      titleHi: 'सूचनाएं',
      total: 32,
      occupied: 24,
      icon: Bell,
      path: '/notifications'
    }
  ];

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <div>
        <h2 className="text-[#00247D]">Dashboard Overview</h2>
        <p className="text-gray-600 text-sm">
          Real-time statistics and system status | वास्तविक समय के आंकड़े
        </p>
      </div>

      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <a
              key={stat.title}
              href={stat.path}
              className={`block bg-white border-2 ${stat.border} rounded-sm p-6 hover:shadow-md`}
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-xs text-gray-500">{stat.titleHi}</p>
                  <p className="text-3xl mt-2 text-[#00247D]">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-sm flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* ================= RESOURCES ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {resourceStats.map((r) => {
          const Icon = r.icon;
          let percent = 0;

          if (r.title === 'Room Occupancy') {
            percent = overview?.occupancy.roomPercent ?? 0;
          }
          if (r.title === 'Vehicle Fleet') {
            percent = overview?.occupancy.vehiclePercent ?? 0;
          }
          if (r.title === 'Duty Roster') {
            percent = overview?.occupancy.dutyRosterPercent ?? 0;
          }
          if (r.title === 'Notifications') {
            percent = overview?.occupancy.notificationPercent ?? 0;
          }

          return (
            <div key={r.title} className="bg-white border rounded-sm p-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-[#00247D]/10 rounded-sm flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#00247D]" />
                  </div>
                  <div>
                    <h3 className="text-[#00247D]">{r.title}</h3>
                    <p className="text-xs text-gray-500">{r.titleHi}</p>
                  </div>
                </div>
                <span className="text-xl text-[#00247D]">{percent}%</span>
              </div>

              <a
                href={r.path}
                className="text-sm text-[#00247D] hover:underline"
              >
                Manage {r.title}
              </a>
            </div>
          );
        })}
      </div>

      {/* ================= RECENT ACTIVITY ================= */}
      <div className="bg-white border rounded-sm p-6">
        <h3 className="text-[#00247D] mb-4">Recent Activity</h3>

        <div className="space-y-3">
          {overview?.recentActivity.map((a, idx) => (
            <div key={idx} className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <p className="text-sm">{a.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(a.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          {!overview?.recentActivity.length && (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </div>


        {/* ✅ WORKING BUTTON */}
        <a
          href="/activity"
          className="block w-full text-center mt-4 border border-[#00247D] text-[#00247D] py-2 rounded-sm hover:bg-[#00247D]/5"
        >
          View All Activity
        </a>
      </div>

      {/* ================= TODAY SCHEDULE ================= */}
      <div className="bg-white border rounded-sm p-6">
        <h3 className="text-[#00247D] mb-4">Today's Schedule</h3>

        <div className="flex justify-between mb-4">
          <div>
            <p className="text-sm font-medium">Duty Shift Change</p>
            <p className="text-xs text-gray-500">Evening shift reporting</p>
          </div>
          <span className="text-sm text-gray-600">18:00</span>
        </div>

        {/* ✅ WORKING BUTTON */}
        <a
          href="/calendar"
          className="inline-block bg-[#00247D] text-white px-4 py-2 rounded-sm hover:bg-[#001a5c]"
        >
          View Full Calendar
        </a>
      </div>

      {/* ================= ALERTS ================= */}
      <div className="bg-orange-50 border-l-4 border-[#FF9933] p-4 rounded-sm">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-1" />
          <div>
            <h4 className="text-orange-900">
              Attention Required | ध्यान देने योग्य
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-orange-800">
              <li>• 3 VIP guests arriving tomorrow</li>
              <li>• 2 vehicles scheduled for maintenance</li>
              <li>• 5 duty rosters pending approval</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
