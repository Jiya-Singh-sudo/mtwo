import { Send, MessageSquare, Mail, Bell, Clock, CheckCircle, XCircle } from 'lucide-react';

export function Notifications() {
  const notificationLog = [
    {
      id: 'N001',
      type: 'WhatsApp',
      recipient: 'Ram Singh (Driver)',
      message: 'Vehicle assignment for Shri Rajesh Kumar',
      sentAt: '2025-12-06 09:15 AM',
      status: 'Delivered',
      read: true
    },
    {
      id: 'N002',
      type: 'WhatsApp',
      recipient: 'Shri Rajesh Kumar',
      message: 'Welcome to Guest House - Info Package',
      sentAt: '2025-12-06 09:10 AM',
      status: 'Delivered',
      read: true
    },
    {
      id: 'N003',
      type: 'SMS',
      recipient: 'All Housekeeping Staff',
      message: 'Room 201 cleaning required by 2 PM',
      sentAt: '2025-12-06 08:30 AM',
      status: 'Sent',
      read: false
    },
    {
      id: 'N004',
      type: 'Email',
      recipient: 'Department Heads',
      message: 'Daily duty roster summary',
      sentAt: '2025-12-06 08:00 AM',
      status: 'Delivered',
      read: true
    },
    {
      id: 'N005',
      type: 'WhatsApp',
      recipient: 'Mohan Kumar (Driver)',
      message: 'Pickup scheduled for 11:30 AM',
      sentAt: '2025-12-06 07:45 AM',
      status: 'Failed',
      read: false
    },
  ];

  const templates = [
    {
      name: 'Guest Welcome',
      type: 'WhatsApp',
      content: 'Welcome to Government Guest House. Your room {room_number} is ready...'
    },
    {
      name: 'Vehicle Assignment',
      type: 'WhatsApp',
      content: 'Vehicle {vehicle_number} assigned. Driver: {driver_name}...'
    },
    {
      name: 'Duty Reminder',
      type: 'SMS',
      content: 'Your duty is scheduled for {time_slot} at {location}...'
    },
    {
      name: 'Check-out Reminder',
      type: 'WhatsApp',
      content: 'Thank you for staying with us. Checkout time: {checkout_time}...'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[#00247D]">Notification Engine</h2>
        <p className="text-sm text-gray-600">सूचना इंजन - Manage and send notifications to staff and guests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-green-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Sent Today</p>
              <p className="text-3xl text-green-600">24</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-yellow-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-10 h-10 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl text-yellow-600">8</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-red-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-10 h-10 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-3xl text-red-600">1</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <Bell className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total This Week</p>
              <p className="text-3xl text-blue-600">156</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Composer */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Compose New Notification</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Notification Type</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
                  <option>WhatsApp</option>
                  <option>SMS</option>
                  <option>Email</option>
                  <option>Push Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Recipient Group</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
                  <option>Single User</option>
                  <option>All Drivers</option>
                  <option>All Officers</option>
                  <option>Housekeeping Staff</option>
                  <option>Department Heads</option>
                  <option>All Staff</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Select Template (Optional)</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
                <option>-- No Template --</option>
                {templates.map((template, index) => (
                  <option key={index}>{template.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Message</label>
              <textarea
                rows={6}
                placeholder="Type your message here..."
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]"
              />
              <p className="text-xs text-gray-500 mt-1">0 / 500 characters</p>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Send Now
              </button>
              <button className="px-6 py-3 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors">
                Schedule
              </button>
              <button className="px-6 py-3 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors">
                Save Draft
              </button>
            </div>
          </div>
        </div>

        {/* Message Templates */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Message Templates</h3>
          </div>
          <div className="p-6 space-y-3">
            {templates.map((template, index) => (
              <div key={index} className="border border-gray-200 rounded-sm p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-900">{template.name}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.type === 'WhatsApp' ? 'bg-green-100 text-green-700' :
                    template.type === 'SMS' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {template.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{template.content}</p>
              </div>
            ))}
            <button className="w-full py-2 text-sm text-[#00247D] border border-[#00247D] rounded-sm hover:bg-blue-50 transition-colors">
              Create New Template
            </button>
          </div>
        </div>
      </div>

      {/* Notification Log */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-[#00247D]">Notification Log</h3>
            <p className="text-sm text-gray-600 mt-1">Recent notifications sent from the system</p>
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#00247D]">
              <option>All Types</option>
              <option>WhatsApp</option>
              <option>SMS</option>
              <option>Email</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-[#00247D]">
              <option>All Status</option>
              <option>Delivered</option>
              <option>Sent</option>
              <option>Failed</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Recipient</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Message</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Sent At</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notificationLog.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{notification.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {notification.type === 'WhatsApp' && <MessageSquare className="w-4 h-4 text-green-600" />}
                      {notification.type === 'SMS' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                      {notification.type === 'Email' && <Mail className="w-4 h-4 text-purple-600" />}
                      <span className="text-sm text-gray-900">{notification.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{notification.recipient}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{notification.message}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{notification.sentAt}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      notification.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      notification.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {notification.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
