// src/utils/auth.ts
// export function getUser() {
//   const raw = localStorage.getItem('user');
//   return raw ? JSON.parse(raw) : null;
// }

// export function hasPermission(permission: string): boolean {
//   const user = getUser();
//   return user?.permissions?.includes(permission) ?? false;
// }
type UserPayload = {
  sub: string;
  username: string;
  role_id?: string;
  permissions: string[];
};

export function getUser(): UserPayload | null {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as UserPayload) : null;
}

export function hasPermission(permission: string): boolean {
  const user = getUser();
  return user?.permissions?.includes(permission) ?? false;
}
