import { useEffect, useState } from 'react';
import { fetchActivityLogs } from '@/api/activityLog.api';
import type { ActivityLog } from '@/types/activityLog';
import { Pagination } from '@/components/ui/pagination';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    load();
  }, [page]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchActivityLogs({
        page,
        limit: pageSize,
      });
      setLogs(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#00247D]">Activity Log</h2>
        <p className="text-sm text-gray-600">
          System audit trail (read-only)
        </p>
      </div>

      <div className="bg-white border rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Module</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Message</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">IP</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Loading activity…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No activity found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.activity_id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(log.inserted_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{log.module}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">{log.message}</td>
                  <td className="px-4 py-3">
                    {log.performed_by ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {log.inserted_ip ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={total}
        pageSize={pageSize}
        onChange={setPage}
      />
    </div>
  );
}
