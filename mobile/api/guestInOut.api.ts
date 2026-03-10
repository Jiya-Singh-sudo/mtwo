import { safePost, safePatch } from './httpHelpers';

export async function createGuestInOut(payload: any) {
  return safePost('/guest-inout', payload);
}

export async function updateGuestInOut(inoutId: string, payload: any) {
  return safePatch(`/guest-inout/${inoutId}`, payload);
}

export async function softDeleteGuestInOut(inoutId: string) {
  return safePatch(`/guest-inout/${inoutId}/soft-delete`, {});
}
