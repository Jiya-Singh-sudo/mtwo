import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export function RoomOccupancyChart({ data }: { data: any[] }) {
  if (!data?.length) return null;

  return (
    <div className="h-64 w-full mb-6">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="report_date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="occupancy_percentage"
            stroke="#00247D"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
