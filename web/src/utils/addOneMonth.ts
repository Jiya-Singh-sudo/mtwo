/**
 * Add one month to a YYYY-MM-DD date string.
 * Handles month-end overflow (Jan 31 → Feb 28/29).
 */
export function addOneMonth(dateStr: string): string {
    if (!dateStr) return "";

    const d = new Date(dateStr);
    const originalDay = d.getDate();

    d.setMonth(d.getMonth() + 1);

    // handle month-end overflow (e.g. Jan 31 → Mar 3 → clamp to Feb 28/29)
    if (d.getDate() !== originalDay) {
        d.setDate(0); // last day of previous month
    }

    return d.toISOString().split("T")[0];
}
