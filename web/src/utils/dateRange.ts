export function getDateRange(range: string) {
  const now = new Date();
  const from = new Date(now);

  if (range === 'Today') {
    from.setHours(0, 0, 0, 0);
  }

  if (range === 'This Week') {
    from.setDate(now.getDate() - 7);
  }

  if (range === 'This Month') {
    from.setDate(1);
  }

  return {
    fromDate: from.toISOString().slice(0, 10),
    toDate: now.toISOString().slice(0, 10),
  };
}
