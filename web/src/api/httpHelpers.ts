// web/src/api/httpHelpers.ts

// Use environment variable or fallback
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path: string, opts: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    credentials: 'include',
    ...opts
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }

  // FIX: Read text first to check if body exists
  const text = await res.text();
  // If text is empty, return empty object, otherwise parse JSON
  return text ? JSON.parse(text) : {};
}

export const safeGet = (path: string) => request(path);
export const safePost = (path: string, body?: any) => request(path, { method: 'POST', body: JSON.stringify(body) });
export const safePatch = (path: string, body?: any) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
export const safeDelete = (path: string) => request(path, { method: 'DELETE' });