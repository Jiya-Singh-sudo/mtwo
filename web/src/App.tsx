import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppRoutes from '@/routes/AppRoutes';
import { Sidebar } from './components/Sidebar';
// import { Search, Globe } from 'lucide-react';

function Layout() {
  const { isAuthenticated } = useAuth();
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');

  const { logout } = useAuth();

  // Show ONLY login routes when not authenticated
  if (!isAuthenticated) {
    return <AppRoutes />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Government Header */}
        <header className="bg-white border-b border-gray-200">
          {/* Top bar with dark background */}
          <div className="bg-[#2C2C2C] px-8 py-2">
            <div className="flex items-center justify-end gap-4">
              {/* 
              <button className="text-white" onClick={() => setLanguage}>
                Hindi
              </button> */}

              <button className="text-white" onClick={logout}>
                Logout
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
                  <h1 className="text-[#00247D] tracking-wide">लोक भवन महाराष्ट्र</h1>
                  <h2 className="text-[#00247D] mt-1">Lok Bhavan Maharashtra</h2>
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

        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="px-6 py-6 md:px-8 lg:px-10">
            <AppRoutes />
          </div>
        </main>
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-8 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2025 Lok Bhavan Maharashtra | लोक भवन महाराष्ट्र</p>
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
