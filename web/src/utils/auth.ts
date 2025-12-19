// src/utils/auth.ts
export function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function hasPermission(permission: string): boolean {
  const user = getUser();
  return user?.permissions?.includes(permission) ?? false;
}
