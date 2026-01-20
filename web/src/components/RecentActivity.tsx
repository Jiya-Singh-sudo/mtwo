import { useEffect, useState } from 'react';
import {
  UserPlus,
  BedDouble,
  Car,
  Bell,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { fetchActivityLogs } from '@/api/activityLog.api';
import type { ActivityLog } from '@/types/activity-log';

const iconMap: Record<string, any> = {
  USER_CREATE: UserPlus,
  USER_UPDATE: UserPlus,
  USER_DELETE: AlertCircle,

  ROLE_CREATE: CheckCircle,
  ROLE_UPDATE: CheckCircle,

  LOGIN_SUCCESS: CheckCircle,
  LOGIN_FAILED: AlertCircle,

  VEHICLE_ASSIGN: Car,
  NOTIFICATION_SENT: Bell,
};

export function RecentActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchActivityLogs({ page: 1, limit: 5 });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load recent activity', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Recent Activity</h3>
          <p className="text-sm text-gray-600">हाल की गतिविधि</p>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading activity…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const Icon =
                  iconMap[log.action] ?? AlertCircle;

                return (
                  <div
                    key={log.activity_id}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-sm flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900">
                        {log.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.inserted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="w-full mt-4 py-2 text-sm text-[#00247D] border border-[#00247D] rounded-sm hover:bg-blue-50 transition-colors"
            onClick={() => {
              window.location.href = '/activity-log';
            }}
          >
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
