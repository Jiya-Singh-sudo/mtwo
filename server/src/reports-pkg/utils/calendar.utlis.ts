function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ---------- DAILY ---------- */
export function todayRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const d = toDateString(now);
  return { fromDate: d, toDate: d };
}

/* ---------- WEEKLY (SUN → SAT) ---------- */
export function currentWeekRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday

  const start = new Date(now);
  start.setDate(now.getDate() - day);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    fromDate: toDateString(start),
    toDate: toDateString(end),
  };
}

/* ---------- MONTHLY (1 → last) ---------- */
export function currentMonthRange(): { fromDate: string; toDate: string } {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    fromDate: toDateString(start),
    toDate: toDateString(end),
  };
}

/* ---------- CUSTOM ---------- */
export function customRange(
  startDate?: string,
  endDate?: string
) {
  if (!startDate || !endDate) {
    throw new Error('Custom Range requires startDate and endDate');
  }

  return { fromDate: startDate, toDate: endDate };
}
