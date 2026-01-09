// src/utils/dateTime.ts
export function formatDate(date?: string) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
export function formatDateTime(date?: string) {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function to24Hour(
  hour: number,
  minute: string,
  meridiem: "AM" | "PM"
) {
  let h = hour % 12;
  if (meridiem === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

// utils/dateTime.ts
export function formatSeparate(
  date?: string | null,
  time?: string | null
) {
  if (!date) return "N/A";

  const formattedDate = new Date(date).toLocaleDateString("en-GB");

  const formattedTime =
    time && time.length >= 5
      ? time.slice(0, 5) // HH:mm
      : "";

  return formattedTime
    ? `${formattedDate} ${formattedTime}`
    : formattedDate;
}

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

