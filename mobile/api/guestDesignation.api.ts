import { safePost, safePatch } from './httpHelpers';

export async function createGuestDesignation(payload: any) {
  return safePost('/guest-designation', payload);
}
export async function updateGuestDesignation(gd_id: string, payload: any) {
  return safePatch(`/guest-designation/${gd_id}`, payload);
}
