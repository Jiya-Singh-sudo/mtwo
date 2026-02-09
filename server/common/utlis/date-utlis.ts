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
export function parseISTDate(date: string) {
  return new Date(`${date}T00:00:00+05:30`);
}
export function formatISTDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00+05:30`);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
}
/**
 * Safely extracts YYYY-MM-DD from DB values
 * without triggering UTC timezone conversion
 */
export function extractISODate(
  value?: string | Date | null
): string {
  if (!value) return '';

  // If DB driver returns Date object
  if (value instanceof Date) {
    // Use local components, NOT toISOString()
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // If string with time
  if (typeof value === 'string') {
    if (value.includes('T')) return value.split('T')[0];
    if (value.includes(' ')) return value.split(' ')[0];
    return value; // already YYYY-MM-DD
  }

  return '';
}
export function formatDDMMYYYY(value?: string | Date | null): string {
  const iso = extractISODate(value);
  if (!iso) return '';
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}-${mm}-${yyyy}`;
}


