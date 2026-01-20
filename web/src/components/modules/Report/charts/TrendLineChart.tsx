import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export function TrendLineChart({
    data,
    label,
}: {
    data: any[];
    label: string;
}) {
    // Guard against empty/invalid data
    const safeData = Array.isArray(data) ? data : [];

    if (safeData.length === 0) {
        return (
            <div className="h-64 w-full flex items-center justify-center text-gray-500">
                No trend data available
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height: 256 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#00247D"
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

