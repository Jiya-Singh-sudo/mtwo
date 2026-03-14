// mobile/utils/dateTime.ts
// Shared date/time utilities (ported from web)

export function formatDate(date?: string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB");
}

export function formatTime(time?: string | null): string {
  if (!time || time.length < 5) return "";
  return time.slice(0, 5); // HH:mm
}

export function formatSeparate(
  date?: string | null,
  time?: string | null
) {
  if (!date) return "N/A";
  const formattedDate = new Date(date).toLocaleDateString("en-GB");
  const formattedTime =
    time && time.length >= 5 ? time.slice(0, 5) : "";
  return formattedTime ? `${formattedDate} ${formattedTime}` : formattedDate;
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
}

export function normalizeDateOnly(
  value?: string | Date | null
): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}
