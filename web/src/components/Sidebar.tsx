import { 
  Users, 
  Home, 
  Building2, 
  Car, 
  Calendar, 
  FileText, 
  Bell, 
  BarChart3, 
  Settings, 
  UserCog,
  UtensilsCrossed
} from 'lucide-react';
import type { ModuleType } from '../App';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeModule: ModuleType;
}

export function Sidebar({ activeModule }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as ModuleType, label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: Home },
    { id: 'guest-management' as ModuleType, label: 'Guest Management', labelHi: 'अतिथि प्रबंधन', icon: Users },
    { id: 'room-management' as ModuleType, label: 'Room Management', labelHi: 'कक्ष प्रबंधन', icon: Building2 },
    { id: 'vehicle-management' as ModuleType, label: 'Vehicle & Driver', labelHi: 'वाहन और चालक', icon: Car },
    { id: 'guest-transport-management' as ModuleType, label: 'Guest Transport Management', labelHi: 'अतिथि ट्रांसपोर्ट प्रबंधन', icon: UserCog },
    { id: 'driver-duty-roaster' as ModuleType, label:'Driver Duty Roaster', labelHi:'ड्राइवर ड्यूटी रोस्टर',icon: Calendar},
    { id: 'food-service' as ModuleType, label: 'Food Service', labelHi: 'खाद्य सेवा', icon: UtensilsCrossed },
    { id: 'duty-roster' as ModuleType, label: 'Duty Roster', labelHi: 'ड्यूटी रोस्टर', icon: Calendar },
    { id: 'info-package' as ModuleType, label: 'Info Package', labelHi: 'सूचना पैकेज', icon: FileText },
    { id: 'notifications' as ModuleType, label: 'Notifications', labelHi: 'सूचनाएं', icon: Bell },
    { id: 'reports' as ModuleType, label: 'Reports & Analytics', labelHi: 'रिपोर्ट', icon: BarChart3 },
    { id: 'user-management' as ModuleType, label: 'User Management', labelHi: 'उपयोगकर्ता', icon: UserCog },
    { id: 'settings' as ModuleType, label: 'System Settings', labelHi: 'सेटिंग्स', icon: Settings },
  ];
  const navigate = useNavigate();


  return (
    <aside className="w-64 bg-[#00247D] text-white flex flex-col">
      {/* Logo Area */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#F5A623] to-[#E09612] rounded flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#00247D]" />
          </div>
          <div>
            <p className="text-sm opacity-90">Raj Bhavan</p>
            <p className="text-xs opacity-75">Guest House</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(`/${item.id}`)}
              className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
                isActive 
                  ? 'bg-gradient-to-r from-[#F5A623] to-[#E09612] text-[#00247D] border-l-4 border-[#F5A623]' 
                  : 'text-white hover:bg-blue-900'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="text-left flex-1">
                <p className="text-sm">{item.label}</p>
                <p className="text-xs opacity-75">{item.labelHi}</p>
              </div>
            </button>
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