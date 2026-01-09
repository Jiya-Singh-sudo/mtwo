export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function isBefore(a?: string, b?: string) {
  return a && b && a < b;
}

export function isAfter(a?: string, b?: string) {
  return a && b && a > b;
}
