import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppRoutes from '@/routes/AppRoutes';
import { Sidebar } from './components/Sidebar';
import { Search, Globe } from 'lucide-react';

function Layout() {
  const { isAuthenticated } = useAuth();
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');

  // Show ONLY login routes when not authenticated
  if (!isAuthenticated) {
    return <AppRoutes />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar/>
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
          <AppRoutes />
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

export default function App() {
  return (
      <AuthProvider>
        <Layout />
      </AuthProvider>
  );
}
