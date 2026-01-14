// utils/dateKey.ts
export function toDateKey(value: string): string {
  // Handles both YYYY-MM-DD and full ISO strings
  return value.slice(0, 10);
}
