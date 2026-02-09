// src/utils/dateTime.ts
export function BformatDate(date?: string) {
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

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  if (value.includes("T")) return value.split("T")[0];
  if (value.includes(" ")) return value.split(" ")[0];
  return value;
}

export function to24Hour(
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
export function formatDate(date?: string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB");
}

export function formatTime(time?: string | null): string {
  if (!time || time.length < 5) return "";
  return time.slice(0, 5); // HH:mm
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
// ==========================
// API DATE HELPERS (ISO)
// ==========================

/**
 * Converts DD-MM-YYYY → YYYY-MM-DD
 * Used ONLY for backend API calls
 */
export function toISODate(ddmmyyyy?: string | null): string | undefined {
  if (!ddmmyyyy) return undefined;

  // Accept already-ISO values safely
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) {
    return ddmmyyyy;
  }

  const [dd, mm, yyyy] = ddmmyyyy.split("-");
  if (!dd || !mm || !yyyy) return undefined;

  return `${yyyy}-${mm}-${dd}`;
}

// For the TRANSPORT MANAGEMENT MODULE
// ==========================
// DATE ARITHMETIC HELPERS
// ==========================

export function addDays(date: string | Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Returns YYYY-MM-DD (for <input type="date">)
 */
export function toISODateOnly(value: Date | string): string {
  const d = new Date(value);
  return d.toISOString().split("T")[0];
}

/**
 * Returns YYYY-MM-DDTHH:mm (for <input type="datetime-local">)
 */
export function toISOLocalDateTime(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 16);
}

/**
 * Inclusive date range check
 */
export function isDateWithinRange(
  date: string,
  min: string,
  max: string
): boolean {
  return date >= min && date <= max;
}
export function combineDateAndTime(
  date?: string,
  time?: string
): string | undefined {
  if (!date || !time) return undefined;
  return `${date}T${time}:00`;
}
export function splitDateTime(value?: string) {
  if (!value) return { date: "", time: "" };

  const [date, time] = value.split("T");
  return {
    date,
    time: time?.slice(0, 5), // HH:mm
  };
}
  