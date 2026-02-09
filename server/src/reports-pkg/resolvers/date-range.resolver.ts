// server/src/reports-pkg/resolvers/date-range.resolver.ts
import {
  todayRange,
  currentWeekRange,
  currentMonthRange,
  customRange,
} from '../utils/calendar.utlis';

// export interface ResolvedDateRange {
//   fromDate: string;
//   toDate: string;
// }

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function startOfWeekSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d;
}

function endOfWeekSaturday(date: Date): Date {
  const d = startOfWeekSunday(date);
  d.setDate(d.getDate() + 6);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function resolveDateRange(
  rangeType: string,
  custom?: { startDate?: string; endDate?: string }
){
  const today = new Date();

  switch (rangeType) {
    case 'Daily':
      return todayRange();

    case 'Weekly': {
      return currentWeekRange();
    }

    case 'Monthly': 
      return currentMonthRange();


    case 'Custom Range':
      return customRange(custom?.startDate, custom?.endDate);

    default:
      throw new Error(`Unsupported range type: ${rangeType}`);
  }
}

