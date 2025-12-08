import { 
  UserPlus, 
  BedDouble, 
  CarFront, 
  FileText, 
  Bell, 
  Calendar,
  Download,
  Settings,
  UserCog,
  UtensilsCrossed
} from 'lucide-react';
import type { ModuleType } from '../App';

interface QuickActionsProps {
  onNavigate: (module: ModuleType) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  const actions = [
    {
      title: 'Add New Guest',
      titleHi: 'नया अतिथि जोड़ें',
      icon: UserPlus,
      color: 'bg-[#00247D] hover:bg-blue-900',
      module: 'guest-management' as ModuleType
    },
    {
      title: 'Allocate Room',
      titleHi: 'कक्ष आवंटित करें',
      icon: BedDouble,
      color: 'bg-green-600 hover:bg-green-700',
      module: 'room-management' as ModuleType
    },
    {
      title: 'Assign Vehicle',
      titleHi: 'वाहन आवंटित करें',
      icon: CarFront,
      color: 'bg-purple-600 hover:bg-purple-700',
      module: 'vehicle-management' as ModuleType
    },
    {
      title: 'Manage Drivers',
      titleHi: 'चालक प्रबंधित करें',
      icon: UserCog,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      module: 'driver-management' as ModuleType
    },
    {
      title: 'Food Service',
      titleHi: 'खाद्य सेवा',
      icon: UtensilsCrossed,
      color: 'bg-pink-600 hover:bg-pink-700',
      module: 'food-service' as ModuleType
    },
    {
      title: 'Create Duty Roster',
      titleHi: 'ड्यूटी रोस्टर बनाएं',
      icon: Calendar,
      color: 'bg-gradient-to-r from-[#F5A623] to-[#E09612] hover:from-[#E09612] hover:to-[#D48810] text-[#00247D]',
      module: 'duty-roster' as ModuleType
    },
    {
      title: 'Generate Info Package',
      titleHi: 'सूचना पैकेज बनाएं',
      icon: FileText,
      color: 'bg-teal-600 hover:bg-teal-700',
      module: 'info-package' as ModuleType
    },
    {
      title: 'Send Notification',
      titleHi: 'सूचना भेजें',
      icon: Bell,
      color: 'bg-red-600 hover:bg-red-700',
      module: 'notifications' as ModuleType
    },
    {
      title: 'Generate Report',
      titleHi: 'रिपोर्ट बनाएं',
      icon: Download,
      color: 'bg-orange-600 hover:bg-orange-700',
      module: 'reports' as ModuleType
    },
    {
      title: 'System Settings',
      titleHi: 'सिस्टम सेटिंग्स',
      icon: Settings,
      color: 'bg-gray-600 hover:bg-gray-700',
      module: 'settings' as ModuleType
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[#00247D]">Quick Actions</h3>
        <p className="text-sm text-gray-600">त्वरित कार्य</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={() => onNavigate(action.module)}
              className={`${action.color} text-white p-4 rounded-sm transition-all hover:shadow-lg flex flex-col items-center justify-center gap-2 min-h-[120px]`}
            >
              <Icon className="w-8 h-8" />
              <div className="text-center">
                <p className="text-sm">{action.title}</p>
                <p className="text-xs opacity-90 mt-1">{action.titleHi}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}