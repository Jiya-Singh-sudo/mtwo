import api, { safeGet } from "./apiClient";
import type {
  GuestDriverCreateDto,
  GuestDriver
} from "../types/guestDriver";

/* ===============================
   READ
   =============================== */

/* Get active trip for a guest */
export async function getActiveGuestDriver(guestId: string) {
  return safeGet<GuestDriver>(
    `/guest-driver/active/${encodeURIComponent(guestId)}`
  );
}

/* (Alternate endpoint – exists in backend) */
export async function getActiveGuestDriverAlt(guestId: string) {
  return safeGet<GuestDriver>(
    `/guest-driver/activeguests/${encodeURIComponent(guestId)}`
  );
}

/* Get all ACTIVE trips (all guests) */
export async function getActiveGuestDrivers() {
  return safeGet<GuestDriver[]>(
    "/guest-driver"
  );
}

/* Get ALL trips (history + active) */
export async function getAllGuestDrivers() {
  return safeGet<GuestDriver[]>(
    "/guest-driver/all"
  );
}

/* ===============================
   WRITE
   =============================== */

/* Assign driver (shortcut) */
export async function assignGuestDriver(
  data: GuestDriverCreateDto,
  user = "system"
) {
  const res = await api.post(
    "/guest-driver/assign",
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

/* Create full trip */
export async function createGuestDriver(
  data: GuestDriverCreateDto,
  user = "system"
) {
  const res = await api.post(
    "/guest-driver",
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

/* Revise trip (CLOSE + INSERT) */
export async function reviseGuestDriver(
  guestDriverId: string,
  data: Partial<GuestDriverCreateDto>,
  user = "system"
) {
  const res = await api.post(
    `/guest-driver/revise/${encodeURIComponent(guestDriverId)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

/* Close trip */
export async function closeGuestDriver(
  guestDriverId: string,
  user = "system"
) {
  const res = await api.delete(
    `/guest-driver/${encodeURIComponent(guestDriverId)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// // src/api/guestDriver.api.ts
// import api, { safeGet } from "./apiClient";
// import type {
//   GuestDriverCreateDto,
//   GuestDriver
// } from "../types/guestDriver";

// /* ===============================
//    READ
//    =============================== */

// /* Get active trip for a guest */
// export async function getActiveGuestDriver(guestId: string) {
//   return safeGet<GuestDriver>(
//     `/guest-driver/active/${encodeURIComponent(guestId)}`
//   );
// }

// /* Get all trips (history + active) */
// export async function getAllGuestDrivers(activeOnly = false) {
//   return safeGet<GuestDriver[]>(
//     `/guest-driver?activeOnly=${activeOnly}`
//   );
// }

// /* ===============================
//    WRITE
//    =============================== */

// /* Create trip */
// export async function createGuestDriver(
//   data: GuestDriverCreateDto,
//   user = "system"
// ) {
//   const res = await api.post("/guest-driver", data, {
//     headers: { "x-user": user },
//   });
//   return res.data;
// }

// /* Assign driver (shortcut API) */
// export async function assignGuestDriver(
//   data: GuestDriverCreateDto,
//   user = "system"
// ) {
//   const res = await api.post("/guest-driver/assign", data, {
//     headers: { "x-user": user },
//   });
//   return res.data;
// }

// /* Revise trip (CLOSE + INSERT) */
// export async function reviseGuestDriver(
//   guestDriverId: string,
//   data: Partial<GuestDriverCreateDto>,
//   user = "system"
// ) {
//   const res = await api.post(
//     `/guest-driver/revise/${encodeURIComponent(guestDriverId)}`,
//     data,
//     { headers: { "x-user": user } }
//   );
//   return res.data;
// }

// /* Close trip */
// export async function closeGuestDriver(
//   guestDriverId: string,
//   user = "system"
// ) {
//   const res = await api.patch(
//     `/guest-driver/close/${encodeURIComponent(guestDriverId)}`,
//     {},
//     { headers: { "x-user": user } }
//   );
//   return res.data;
// }
