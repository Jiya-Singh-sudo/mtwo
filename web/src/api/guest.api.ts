import { safeGet, safePost, safePatch, safeDelete } from './httpHelpers';

export async function getActiveGuests() {
  return safeGet('/guests/active');
}

export async function createGuest(payload: { guest: any; designation?: any; inout?: any }) {
  return safePost('/guests', payload);
}

export async function updateGuest(id: number | string, payload: any) {
  return safePatch(`/guests/${id}`, payload);
}

export async function softDeleteGuest(id: number | string) {
  return safeDelete(`/guests/${id}`);
}
