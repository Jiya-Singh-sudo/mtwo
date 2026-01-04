// src/utils/dateTime.ts
export function formatISTDateTime(value?: string | null): string {
    if (!value) return "-";

    const date = new Date(value);
    return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export function formatISTDate(value?: string | null): string {
    if (!value) return "-";

    const date = new Date(value);
    return date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function toDateTimeLocal(value?: string | null): string {
    if (!value) return "";
    return new Date(value).toISOString().slice(0, 16);
}
export function formatISTTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
