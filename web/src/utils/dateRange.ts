export function getDateRange(range: string) {
  const now = new Date();
  const start = new Date();

  switch (range) {
    case 'Today':
      start.setHours(0, 0, 0, 0);
      break;

    case 'This Week':
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      break;

    case 'This Month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;

    default:
      start.setHours(0, 0, 0, 0);
  }

  return {
    fromDate: start.toISOString().slice(0, 10),
    toDate: now.toISOString().slice(0, 10),
  };
}
