export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function isBefore(a?: string, b?: string) {
  return a && b && a < b;
}

export function isAfter(a?: string, b?: string) {
  return a && b && a > b;
}
export function formatDateTime(
  value?: string | Date | null,
): string {
  if (!value) return '-';

  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';

  const pad = (n: number) => n.toString().padStart(2, '0');

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
