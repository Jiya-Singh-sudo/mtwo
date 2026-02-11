import { safeGet, safePost, safeDelete } from './httpHelpers';

/* =========================
   GET BY GUEST
========================= */

export async function getGuestMedicalContacts(guestId: string) {
  return safeGet(`/guest-medical-contact/${guestId}`);
}

/* =========================
   CREATE (ASSIGN SERVICE TO GUEST)
========================= */

export async function assignMedicalContactToGuest(payload: {
  guest_id: string;
  service_id: string;
}) {
  return safePost('/guest-medical-contact', payload);
}

/* =========================
   SOFT DELETE (REMOVE CONTACT)
========================= */

export async function removeGuestMedicalContact(
  medicalContactId: string
) {
  return safeDelete(`/guest-medical-contact/${medicalContactId}`);
}
