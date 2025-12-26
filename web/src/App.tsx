import { useState } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/modules/DashboardStats/Page';
import { QuickActions } from './components/QuickActions';
import { RecentActivity } from './components/RecentActivity';
import { GuestManagement } from './components/modules/GuestManagement/Page';
import RoomManagement from "./components/modules/RoomManagement/page";
import { VehicleManagement } from "./components/modules/VehicleManagement/Page";
import { DutyRoster } from './components/modules/DutyRoaster/Page';
import DriverDutyRoaster from './components/modules/DriverDutyRoaster/Page';
import InfoPackage from './components/modules/InfoPackage/Page';
import { Notifications } from './components/modules/Notification/Page';
import { Reports } from './components/modules/Report/Page';
import UserManagement from './components/modules/UserManagement/Page';
import { SystemSettings } from './components/modules/SystemSettings/Page';
import DriverManagement from './components/modules/DriverManagement/Page';
import { FoodService } from "./components/modules/FoodService/Page";
import { Search, Globe } from 'lucide-react';
// import ashokaEmblem from './ashoka_emblem.png';
// import maharashtraSeal from './maharashtra_seal.png';
// import indianFlag from './indian_flag.png';

export type ModuleType =
  | 'dashboard'
  | 'guest-management'
  | 'room-management'
  | 'vehicle-management'
  | 'duty-roster'
  | 'driver-duty-roaster'
  | 'info-package'
  | 'notifications'
  | 'reports'
  | 'user-management'
  | 'settings'
  | 'driver-management'
  | 'food-service';

export default function App() {

  const location = useLocation();
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const activeModule = location.pathname.replace('/', '') as ModuleType || 'dashboard';


  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardStats />
            <QuickActions />
            <RecentActivity />
          </div>
        );
      case 'guest-management':
        return <GuestManagement />;
      case 'room-management':
        return <RoomManagement />;
      case 'vehicle-management':
        return <VehicleManagement />;
      case 'duty-roster':
        return <DutyRoster />;
      case 'driver-duty-roaster':
        return <DriverDutyRoaster />;
      case 'info-package':
        return <InfoPackage />;
      case 'notifications':
        return <Notifications />;
      case 'reports':
        return <Reports />;
      case 'user-management':
        return <UserManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'driver-management':
        return <DriverManagement />;
      case 'food-service':
        return <FoodService />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeModule={activeModule} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Government Header */}
        <header className="bg-white border-b border-gray-200">
          {/* Top bar with dark background */}
          <div className="bg-[#2C2C2C] px-8 py-2">
            <div className="flex items-center justify-end gap-4">
              <button className="text-white text-sm hover:text-gray-300" onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')}>
                {language === 'english' ? 'HINDI' : 'ENGLISH'}
              </button>
            </div>
          </div>

          {/* Main header with logos */}
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Ashoka emblem and text */}
              <div className="flex items-center gap-4">
                {/* Ashoka Emblem - Real Image */}
                <img
                  src={"./public/ashoka_emblem.png"}
                  alt="Government of India Emblem"
                  className="w-20 h-24 object-contain"
                />

                {/* Title */}
                <div>
                  <h1 className="text-[#00247D] tracking-wide">राजभवन महाराष्ट्र</h1>
                  <h2 className="text-[#00247D] mt-1">Raj Bhavan Maharashtra</h2>
                  <p className="text-sm text-gray-600 mt-1">Guest House Management System</p>
                </div>
              </div>

              {/* Right: Government seal and flag */}
              <div className="flex items-center gap-6">
                {/* Maharashtra Government Seal - Real Image */}
                <img
                  src={"./public/maharashtra_seal.png"}
                  alt="Maharashtra Government Seal"
                  className="w-20 h-20 object-contain"
                />

                {/* Indian Flag - Real Image */}
                <img
                  src={"./public/indian_flag.png"}
                  alt="Indian National Flag"
                  className="w-20 h-14 object-cover rounded-sm shadow border border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Search bar and tabs section */}
          <div className="bg-[#F2F2F2] px-8 py-3 border-t border-gray-300">
            <div className="flex items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search guests, rooms, vehicles..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Language Preferences */}
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-600" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'english' | 'hindi')}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent cursor-pointer"
                >
                  <option value="english">English</option>
                  <option value="hindi">हिन्दी (Hindi)</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="px-8 py-6">
            {<Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/*" element={renderModule()} />
            </Routes>}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2025 Raj Bhavan Maharashtra | राजभवन महाराष्ट्र</p>
            <p>Version 1.0.0 | Powered by NIC</p>
          </div>
        </footer>
      </div>
    </div>
  );
}