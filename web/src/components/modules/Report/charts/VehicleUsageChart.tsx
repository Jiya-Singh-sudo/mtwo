import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: any[];
}

export function VehicleUsageChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-64 w-full mb-6">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="vehicle_no" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="total_assignments"
            fill="#2E7D32"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
