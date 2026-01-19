import { X } from 'lucide-react';
import { ReportCode } from '@/types/reports.types';
import { RoomOccupancyChart } from './RoomOccupancyChart';
import { VehicleUsageChart } from './VehicleUsageChart';

/* ---------- HELPERS ---------- */

function prettifyHeader(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(key: string, value: any) {
  if (value === null || value === undefined) return '—';

  // Percentage
  if (key.includes('percentage')) {
    return `${value}%`;
  }

  // Boolean
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Date or datetime
  if (
    typeof value === 'string' &&
    (value.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(value))
  ) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return String(value);
}

/* ---------- COMPONENT ---------- */

interface Props {
  open: boolean;
  title: string;
  data: any[];
  reportCode?: ReportCode | null;
  onClose: () => void;
}

export function ReportPreviewModal({
  open,
  title,
  data,
  reportCode,
  onClose,
}: Props) {
  if (!open) return null;

  const columns = data.length ? Object.keys(data[0]) : [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-[90%] max-h-[80%] rounded-sm flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-[#00247D]">{title}</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-auto">

          {/* CHARTS */}
          {reportCode === ReportCode.ROOM_OCCUPANCY_TRENDS && (
            <>
              <h4 className="text-sm font-medium mb-2">
                Room Occupancy Trend
              </h4>
              <RoomOccupancyChart data={data} />
            </>
          )}

          {reportCode === ReportCode.VEHICLE_USAGE && (
            <>
              <h4 className="text-sm font-medium mb-2">
                Vehicle Usage
              </h4>
              <VehicleUsageChart data={data} />
            </>
          )}

          {/* TABLE */}
          {data.length === 0 ? (
            <p className="text-gray-500 text-center mt-6">
              No data available for this report.
            </p>
          ) : (
            <table className="w-full border mt-4">
              <thead className="bg-gray-100">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c}
                      className="px-3 py-2 border text-left text-sm font-medium"
                    >
                      {prettifyHeader(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-t">
                    {columns.map((c) => (
                      <td
                        key={c}
                        className="px-3 py-2 border text-sm"
                      >
                        {formatValue(c, row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t px-6 py-3 text-right">
          <button
            className="border px-4 py-2 rounded-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
