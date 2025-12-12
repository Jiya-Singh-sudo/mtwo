const BASE = ''; // or '/api' if you proxy

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
  return res.json();
}

export const safeGet = (path: string) => request(path);
export const safePost = (path: string, body?: any) => request(path, { method: 'POST', body: JSON.stringify(body) });
export const safePatch = (path: string, body?: any) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
export const safeDelete = (path: string) => request(path, { method: 'DELETE' });
