import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: DateRangePickerProps) {
  const today = new Date().toISOString().split('T')[0];

  const setToday = () => {
    onStartDateChange(today);
    onEndDateChange(today);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    onStartDateChange(yesterdayStr);
    onEndDateChange(yesterdayStr);
  };

  const setLast7Days = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    onStartDateChange(weekAgo.toISOString().split('T')[0]);
    onEndDateChange(today);
  };

  const setLast30Days = () => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    onStartDateChange(monthAgo.toISOString().split('T')[0]);
    onEndDateChange(today);
  };

  return (
    <div className="bg-white border-2 border-[#F5A623] rounded-sm p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#00247D]" />
          <h3 className="text-[#00247D] font-semibold">Date Range Filter | दिनांक सीमा फ़िल्टर</h3>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Filters */}
          <div className="flex gap-2">
            <button
              onClick={setToday}
              className="px-3 py-1.5 text-xs bg-[#00247D] text-white rounded-sm hover:bg-[#003a9e] transition-colors"
            >
              Today
            </button>
            <button
              onClick={setYesterday}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors"
            >
              Yesterday
            </button>
            <button
              onClick={setLast7Days}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={setLast30Days}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors"
            >
              Last 30 Days
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              max={endDate}
              className="px-3 py-1.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate}
              max={today}
              className="px-3 py-1.5 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Selected Range Display */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-[#00247D]">Selected Period:</span>{' '}
          {new Date(startDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}{' '}
          to{' '}
          {new Date(endDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
          {' '}
          ({Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day
          {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) !== 0 ? 's' : ''})
        </p>
      </div>
    </div>
  );
}
