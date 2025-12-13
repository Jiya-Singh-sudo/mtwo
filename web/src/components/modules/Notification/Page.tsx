import { useState } from 'react';
import {
  Send,
  MessageSquare,
  Mail,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'WhatsApp' | 'SMS' | 'Email';
  recipient: string;
  message: string;
  sentAt: string;
  status: 'Delivered' | 'Sent' | 'Failed' | 'Pending';
}

export function Notifications() {
  /* ---------------- STATE ---------------- */
  const [notificationLog, setNotificationLog] = useState<Notification[]>([
    {
      id: 'N001',
      type: 'WhatsApp',
      recipient: 'Ram Singh (Driver)',
      message: 'Vehicle assignment for Shri Rajesh Kumar',
      sentAt: '2025-12-06 09:15 AM',
      status: 'Delivered',
    },
    {
      id: 'N002',
      type: 'WhatsApp',
      recipient: 'Shri Rajesh Kumar',
      message: 'Welcome to Guest House - Info Package',
      sentAt: '2025-12-06 09:10 AM',
      status: 'Delivered',
    },
    {
      id: 'N003',
      type: 'SMS',
      recipient: 'All Housekeeping Staff',
      message: 'Room 201 cleaning required by 2 PM',
      sentAt: '2025-12-06 08:30 AM',
      status: 'Sent',
    },
  ]);

  const templates = [
    {
      name: 'Guest Welcome',
      type: 'WhatsApp',
      content:
        'Welcome to Government Guest House. Your room {room_number} is ready.',
    },
    {
      name: 'Vehicle Assignment',
      type: 'WhatsApp',
      content:
        'Vehicle {vehicle_number} assigned. Driver: {driver_name}.',
    },
    {
      name: 'Duty Reminder',
      type: 'SMS',
      content:
        'Your duty is scheduled for {time_slot} at {location}.',
    },
  ];

  const [form, setForm] = useState({
    type: 'WhatsApp',
    recipientGroup: 'Single User',
    message: '',
  });

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  /* ---------------- HELPERS ---------------- */
  const now = () =>
    new Date().toISOString().slice(0, 16).replace('T', ' ');

  /* ---------------- ACTIONS ---------------- */
  function sendNow() {
    if (!form.message.trim()) {
      alert('Message is required');
      return;
    }

    setNotificationLog((prev) => [
      {
        id: `N${prev.length + 1}`.padStart(4, '0'),
        type: form.type as any,
        recipient: form.recipientGroup,
        message: form.message,
        sentAt: now(),
        status: 'Delivered',
      },
      ...prev,
    ]);

    setForm({ ...form, message: '' });
  }

  function saveDraft() {
    if (!form.message.trim()) {
      alert('Nothing to save');
      return;
    }
    alert('Draft saved (mock)');
  }

  function scheduleSend() {
    if (!scheduleTime) {
      alert('Please select schedule time');
      return;
    }

    setNotificationLog((prev) => [
      {
        id: `N${prev.length + 1}`.padStart(4, '0'),
        type: form.type as any,
        recipient: form.recipientGroup,
        message: form.message,
        sentAt: scheduleTime,
        status: 'Pending',
      },
      ...prev,
    ]);

    setIsScheduleOpen(false);
    setForm({ ...form, message: '' });
  }

  /* ---------------- STATS ---------------- */
  const sentToday = notificationLog.filter(
    (n) => n.status === 'Delivered'
  ).length;
  const pending = notificationLog.filter(
    (n) => n.status === 'Pending'
  ).length;
  const failed = notificationLog.filter(
    (n) => n.status === 'Failed'
  ).length;

  /* ======================================================
     UI
====================================================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-[#00247D]">Notification Engine</h2>
        <p className="text-sm text-gray-600">
          सूचना इंजन - Manage and send notifications
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat icon={<CheckCircle />} label="Sent Today" value={sentToday} color="green" />
        <Stat icon={<Clock />} label="Pending" value={pending} color="yellow" />
        <Stat icon={<XCircle />} label="Failed" value={failed} color="red" />
        <Stat icon={<Bell />} label="Total" value={notificationLog.length} color="blue" />
      </div>

      {/* COMPOSER + TEMPLATES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COMPOSER */}
        <div className="lg:col-span-2 bg-white border rounded-sm">
          <div className="border-b px-6 py-4">
            <h3 className="text-[#00247D]">Compose New Notification</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <select
                className="border px-3 py-2 rounded-sm"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value })
                }
              >
                <option>WhatsApp</option>
                <option>SMS</option>
                <option>Email</option>
              </select>

              <select
                className="border px-3 py-2 rounded-sm"
                value={form.recipientGroup}
                onChange={(e) =>
                  setForm({ ...form, recipientGroup: e.target.value })
                }
              >
                <option>Single User</option>
                <option>All Drivers</option>
                <option>All Staff</option>
              </select>
            </div>

            <textarea
              rows={6}
              className="w-full border px-3 py-2 rounded-sm"
              placeholder="Type your message..."
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
            />

            <div className="flex gap-3">
              <button
                className="flex-1 bg-[#00247D] text-white py-3 rounded-sm flex items-center justify-center gap-2"
                onClick={sendNow}
              >
                <Send size={18} /> Send Now
              </button>

              <button
                className="border px-6 py-3 rounded-sm"
                onClick={() => setIsScheduleOpen(true)}
              >
                Schedule
              </button>

              <button
                className="border px-6 py-3 rounded-sm"
                onClick={saveDraft}
              >
                Save Draft
              </button>
            </div>
          </div>
        </div>

        {/* TEMPLATES */}
        <div className="bg-white border rounded-sm">
          <div className="border-b px-6 py-4">
            <h3 className="text-[#00247D]">Message Templates</h3>
          </div>

          <div className="p-6 space-y-3">
            {templates.map((t, i) => (
              <div
                key={i}
                className="border p-4 rounded-sm cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setForm({ ...form, message: t.content, type: t.type })
                }
              >
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {t.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOG */}
      <div className="bg-white border rounded-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-[#00247D]">Notification Log</h3>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Recipient</th>
              <th className="px-6 py-3 text-left">Message</th>
              <th className="px-6 py-3 text-left">Sent At</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {notificationLog.map((n) => (
              <tr key={n.id} className="border-t">
                <td className="px-6 py-3">{n.id}</td>
                <td className="px-6 py-3">{n.type}</td>
                <td className="px-6 py-3">{n.recipient}</td>
                <td className="px-6 py-3">{n.message}</td>
                <td className="px-6 py-3">{n.sentAt}</td>
                <td className="px-6 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    n.status === 'Delivered'
                      ? 'bg-green-100 text-green-700'
                      : n.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {n.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SCHEDULE MODAL */}
      {isScheduleOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Schedule Notification</h2>
              <button onClick={() => setIsScheduleOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
              <label>Schedule Date & Time</label>
              <input
                type="datetime-local"
                className="nicInput"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setIsScheduleOpen(false)}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={scheduleSend}>
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- SMALL HELPER ---------- */
function Stat({ icon, label, value, color }: any) {
  return (
    <div className={`bg-white border-2 border-${color}-200 rounded-sm p-6`}>
      <div className="flex items-center gap-3">
        <div className={`text-${color}-600`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-3xl text-${color}-600`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
