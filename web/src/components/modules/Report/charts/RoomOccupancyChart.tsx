import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  OCCUPIED: '#00247D',
  VACANT: '#16a34a',
  MAINTENANCE: '#f97316',
  BLOCKED: '#dc2626',
};

export function RoomOccupancyChart({ data }: { data: any[] }) {
  // Transform data to show count per status
  const statusCounts = data.reduce((acc: Record<string, number>, room) => {
    const status = room.status || 'VACANT';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="bg-white border rounded-sm p-4">
      <h4 className="text-[#00247D] mb-3">Room Occupancy</h4>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count">
            {chartData.map((entry, index) => (
              <Cell key={index} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
