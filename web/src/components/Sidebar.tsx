import {
  Users,
  Home,
  Building2,
  Car,
  Calendar,
  FileText,
  Bell,
  BarChart3,
  // Settings,
  UserCog,
  UtensilsCrossed
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type MenuItem = {
  id: string;
  label: string;
  labelHi: string;
  icon: any;
  path: string;
  permission?: string; // 🔑 permission required to see it
};


export function Sidebar() {
  const { hasPermission } = useAuth();

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      labelHi: 'डैशबोर्ड',
      icon: Home,
      path: '/dashboard',
    },

    {
      id: 'guest-management',
      label: 'Guest Management',
      labelHi: 'अतिथि प्रबंधन',
      icon: Users,
      path: '/guest-management',
      permission: 'guest.view',
    },

    {
      id: 'room-management',
      label: 'Room Management',
      labelHi: 'कक्ष प्रबंधन',
      icon: Building2,
      path: '/room-management',
      permission: 'room.view',
    },

    {
      id: 'vehicle-management',
      label: 'Vehicle & Driver',
      labelHi: 'वाहन और चालक',
      icon: Car,
      path: '/vehicle-management',
      permission: 'vehicle.view',
    },

    {
      id: 'transport-management',
      label: 'Transport Management',
      labelHi: 'ट्रांसपोर्ट प्रबंधन',
      icon: UserCog,
      path: '/transport-management',
      permission: 'transport.view',
    },

    {
      id: 'driver-duty-roaster',
      label: 'Driver Duty Roaster',
      labelHi: 'ड्राइवर ड्यूटी रोस्टर',
      icon: Calendar,
      path: '/driver-duty-roaster',
      permission: 'driver_duty.view',
    },

    {
      id: 'food-service',
      label: 'Food Service',
      labelHi: 'खाद्य सेवा',
      icon: UtensilsCrossed,
      path: '/food-service',
      permission: 'food.view',
    },

    {
      id: 'network-management',
      label: 'Network Management',
      labelHi: 'नेटवर्क प्रबंधन',
      icon: Building2,
      path: '/network-management',
      permission: 'network.view',
    },
/*
    {
      id: 'duty-roster',
      label: 'Duty Roster',
      labelHi: 'ड्यूटी रोस्टर',
      icon: Calendar,
      path: '/duty-roster',
      permission: 'duty.view',
    },*/

    {
      id: 'info-package',
      label: 'Info Package',
      labelHi: 'सूचना पैकेज',
      icon: FileText,
      path: '/info-package',
      permission: 'info.view',
    },

    {
      id: 'notifications',
      label: 'Notifications',
      labelHi: 'सूचनाएं',
      icon: Bell,
      path: '/notifications',
      permission: 'notification.view',
    },

    {
      id: 'reports',
      label: 'Reports & Analytics',
      labelHi: 'रिपोर्ट',
      icon: BarChart3,
      path: '/reports',
      permission: 'report.view',
    },

    {
      id: 'user-management',
      label: 'User Management',
      labelHi: 'उपयोगकर्ता',
      icon: UserCog,
      path: '/user-management',
      permission: 'user.view',
    },

    {
      id: 'activity-log',
      label: 'Activity Log',
      labelHi: 'गतिविधि लॉग',
      icon: FileText,
      path: '/activity-log',
      permission: 'audit.view',
    },


   /* {
      id: 'settings',
      label: 'System Settings',
      labelHi: 'सेटिंग्स',
      icon: Settings,
      path: '/settings',
      permission: 'settings.view',
    },*/
  ];

  return (
    <aside className="w-64 bg-[#00247D] text-white flex flex-col">
      {/* Logo Area */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#F5A623] to-[#E09612] rounded flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#00247D]" />
          </div>
          <div>
            <p className="text-sm opacity-90">Lok Bhavan</p>
            <p className="text-xs opacity-75">Guest House</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) {
            return null;
          }
          const Icon = item.icon;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `w-full px-6 py-3 flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F5A623] to-[#E09612] text-[#00247D] border-l-4 border-[#F5A623]'
                    : 'text-white hover:bg-blue-900'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="text-left flex-1">
                <p className="text-sm">{item.label}</p>
                <p className="text-xs opacity-75">{item.labelHi}</p>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Info */}
      <div className="p-4 border-t border-blue-800">
        <div className="text-xs opacity-75 text-center">
          <p>NIC Compliant System</p>
          <p className="mt-1">Secure & Accessible</p>
        </div>
      </div>
    </aside>
  );
}