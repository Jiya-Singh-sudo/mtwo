// utils/dateKey.ts
export function toISODateKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}
