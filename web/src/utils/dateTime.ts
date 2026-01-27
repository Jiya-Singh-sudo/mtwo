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
  
  // Handle ISO timestamp (2026-01-21T18:30:00.000Z)
  if (value.includes('T') || value.includes('Z')) {
    const date = new Date(value);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Check if it's DD-MM-YYYY format
  const ddmmyyyyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month}-${day}`;
  }
  
  // Check if it's already YYYY-MM-DD format
  const yyyymmddMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmddMatch) {
    return value;
  }
  
  return "";
}


// function toDateInputValue(date: string | Date | null) {
//   if (!date) return "";
//   const d = new Date(date);
//   return new Date(
//     d.getTime() - d.getTimezoneOffset() * 60000
//   ).toISOString().slice(0, 10);
// }

// function toDateInputValue(value?: string | Date | null) {
//   if (!value) return "";

//   // Case 1: ISO string → extract date part
//   if (typeof value === "string") {
//     // Handles: 2026-01-22T00:00:00.000Z
//     // Handles: 2026-01-22 00:00:00
//     if (value.includes("T")) return value.split("T")[0];
//     if (value.includes(" ")) return value.split(" ")[0];
//     return value; // already YYYY-MM-DD
//   }

//   // Case 2: Date object → format manually (NO toISOString)
//   const year = value.getFullYear();
//   const month = String(value.getMonth() + 1).padStart(2, "0");
//   const day = String(value.getDate()).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }

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

