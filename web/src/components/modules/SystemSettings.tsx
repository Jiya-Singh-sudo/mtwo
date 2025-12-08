import { Settings, Bell, Database, Shield, Globe, Mail } from 'lucide-react';

export function SystemSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[#00247D]">System Settings</h2>
        <p className="text-sm text-gray-600">सिस्टम सेटिंग्स - Configure system preferences and integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Categories */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#00247D]" />
            <h3 className="text-[#00247D]">Room Categories</h3>
          </div>
          <div className="p-6 space-y-3">
            {['Standard', 'Deluxe', 'Suite', 'VIP Suite', 'VVIP Suite'].map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-sm">
                <span className="text-sm text-gray-900">{category}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
            <button className="w-full py-2 text-sm text-[#00247D] border border-[#00247D] rounded-sm hover:bg-blue-50 transition-colors">
              Add New Category
            </button>
          </div>
        </div>

        {/* Vehicle Types */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#00247D]" />
            <h3 className="text-[#00247D]">Vehicle Types</h3>
          </div>
          <div className="p-6 space-y-3">
            {['Sedan', 'SUV', 'MUV', 'Luxury Car', 'Mini Bus'].map((type, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-sm">
                <span className="text-sm text-gray-900">{type}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
            <button className="w-full py-2 text-sm text-[#00247D] border border-[#00247D] rounded-sm hover:bg-blue-50 transition-colors">
              Add New Type
            </button>
          </div>
        </div>

        {/* Duty Categories */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#00247D]" />
            <h3 className="text-[#00247D]">Duty Categories</h3>
          </div>
          <div className="p-6 space-y-3">
            {['Housekeeping', 'Security', 'Kitchen', 'Front Desk', 'Maintenance', 'Transport'].map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-sm">
                <span className="text-sm text-gray-900">{category}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
            <button className="w-full py-2 text-sm text-[#00247D] border border-[#00247D] rounded-sm hover:bg-blue-50 transition-colors">
              Add New Category
            </button>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#00247D]" />
            <h3 className="text-[#00247D]">Emergency Contacts</h3>
          </div>
          <div className="p-6 space-y-3">
            {[
              { name: 'Admin Office', number: '+91-11-XXXX-XXXX' },
              { name: 'Security Control', number: '+91-11-XXXX-YYYY' },
              { name: 'Medical Emergency', number: '+91-11-XXXX-ZZZZ' },
              { name: 'Maintenance Head', number: '+91-98XXX-XXXXX' },
            ].map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-sm">
                <div>
                  <p className="text-sm text-gray-900">{contact.name}</p>
                  <p className="text-xs text-gray-500">{contact.number}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
            <button className="w-full py-2 text-sm text-[#00247D] border border-[#00247D] rounded-sm hover:bg-blue-50 transition-colors">
              Add New Contact
            </button>
          </div>
        </div>
      </div>

      {/* Notification Templates */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#00247D]" />
          <h3 className="text-[#00247D]">Notification Templates</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Guest Welcome Message', type: 'WhatsApp', active: true },
              { name: 'Room Ready Notification', type: 'SMS', active: true },
              { name: 'Vehicle Assignment Alert', type: 'WhatsApp', active: true },
              { name: 'Check-out Reminder', type: 'WhatsApp', active: false },
              { name: 'Duty Assignment Notice', type: 'SMS', active: true },
              { name: 'Emergency Alert', type: 'All Channels', active: true },
            ].map((template, index) => (
              <div key={index} className="border border-gray-200 rounded-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm text-gray-900">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.type}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {template.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-sm hover:bg-blue-50">
                    Edit
                  </button>
                  <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-sm hover:bg-gray-50">
                    {template.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Settings */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <Database className="w-5 h-5 text-[#00247D]" />
          <h3 className="text-[#00247D]">Integration Settings</h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* WhatsApp API */}
            <div className="border border-gray-200 rounded-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-sm flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">WhatsApp Business API</p>
                    <p className="text-sm text-gray-600">Send notifications via WhatsApp</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">Connected</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">API Key</label>
                  <input
                    type="password"
                    value="••••••••••••••••"
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value="+91-XXXXX-XXXXX"
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm bg-gray-50"
                  />
                </div>
              </div>
              <button className="mt-3 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-sm hover:bg-blue-50">
                Update Configuration
              </button>
            </div>

            {/* SMS Gateway */}
            <div className="border border-gray-200 rounded-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-sm flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">SMS Gateway</p>
                    <p className="text-sm text-gray-600">Send SMS notifications</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">Connected</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Provider</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
                    <option>NIC SMS Service</option>
                    <option>Other Provider</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Sender ID</label>
                  <input
                    type="text"
                    value="GHOUSE"
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]"
                  />
                </div>
              </div>
              <button className="mt-3 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-sm hover:bg-blue-50">
                Update Configuration
              </button>
            </div>

            {/* Email SMTP */}
            <div className="border border-gray-200 rounded-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-sm flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-900">Email SMTP</p>
                    <p className="text-sm text-gray-600">Send email notifications</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">Connected</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">SMTP Server</label>
                  <input
                    type="text"
                    value="smtp.gov.in"
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Port</label>
                  <input
                    type="text"
                    value="587"
                    className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]"
                  />
                </div>
              </div>
              <button className="mt-3 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-sm hover:bg-blue-50">
                Update Configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Language & Localization */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <Globe className="w-5 h-5 text-[#00247D]" />
          <h3 className="text-[#00247D]">Language & Localization</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Default Language</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
                <option>English</option>
                <option>हिंदी (Hindi)</option>
                <option>Both (Bilingual)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Date Format</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
                <option>DD-MM-YYYY</option>
                <option>MM-DD-YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Time Zone</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
                <option>IST (UTC+5:30)</option>
              </select>
            </div>
          </div>
          <button className="mt-4 px-6 py-2 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
