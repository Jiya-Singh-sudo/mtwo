export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(method: string, path: string, body?: any, user?: string) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-user": user || "system"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `API ${method} ${path} failed`);
  }

  return res.json();
}

export function apiGet(path: string) {
  return request("GET", path);
}

export function apiPost(path: string, body: any, user?: string) {
  return request("POST", path, body, user);
}

export function apiPut(path: string, body: any, user?: string) {
  return request("PUT", path, body, user);
}

export function apiDelete(path: string, user?: string) {
  return request("DELETE", path, undefined, user);
}
