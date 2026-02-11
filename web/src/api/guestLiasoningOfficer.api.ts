import { safeGet, safePost, safePatch, safeDelete } from './httpHelpers';

/* =========================
   GET BY GUEST
========================= */

export async function getGuestLiasoningOfficers(guestId: string) {
  return safeGet(`/guest-liasoning-officer/${guestId}`);
}

/* =========================
   ASSIGN OFFICER TO GUEST
========================= */

export async function assignLiasoningOfficer(payload: {
  guest_id: string;
  officer_id: string;
  from_date: string; // YYYY-MM-DD
  to_date?: string;  // YYYY-MM-DD
  duty_location?: string;
}) {
  return safePost('/guest-liasoning-officer', payload);
}

/* =========================
   UPDATE ASSIGNMENT
========================= */

export async function updateGuestLiasoningOfficer(
  gloId: string,
  payload: Partial<{
    from_date: string;
    to_date: string;
    duty_location: string;
  }>
) {
  return safePatch(`/guest-liasoning-officer/${gloId}`, payload);
}

/* =========================
   REMOVE (SOFT DELETE)
========================= */

export async function removeGuestLiasoningOfficer(
  gloId: string
) {
  return safeDelete(`/guest-liasoning-officer/${gloId}`);
}
