import api from "./apiClient";

/* ===============================
   READ
   =============================== */

/* Guests checked in but without vehicle */
export async function getGuestsWithoutVehicle() {
  const res = await api.get(
    "/guest-vehicle/guests/checked-in-without-vehicle"
  );
  return res.data;
}

/* Assignable vehicles */
export async function getAssignableVehicles() {
  const res = await api.get(
    "/guest-vehicle/vehicles/assignable"
  );
  return res.data;
}

/* Active vehicle for a guest */
export async function getActiveVehicleByGuest(guestId: string) {
  const res = await api.get(
    `/guest-vehicle/by-guest/${encodeURIComponent(guestId)}`
  );
  return res.data;
}

/* Vehicle history for a guest (active + inactive) */
export async function getVehiclesByGuest(guestId: string) {
  const res = await api.get(
    `/guest-vehicle/guests/${encodeURIComponent(guestId)}/vehicles`
  );
  return res.data;
}

/* Guest vehicles without driver */
export async function getGuestVehiclesWithoutDriver() {
  const res = await api.get(
    "/guest-vehicle/without-driver"
  );
  return res.data;
}

/* ===============================
   WRITE
   =============================== */

/* Assign vehicle to guest */
export async function assignVehicleToGuest(payload: {
  guest_id: string;
  vehicle_no: string;
  location?: string;
}) {
  const res = await api.post(
    "/guest-vehicle/assign",
    payload
  );
  return res.data;
}

/* Reassign vehicle (CLOSE + INSERT) */
export async function reassignVehicleToGuest(
  guestVehicleId: string,
  payload: {
    guest_id: string;
    vehicle_no: string;
    location?: string;
  }
) {
  const res = await api.post(
    `/guest-vehicle/reassign/${encodeURIComponent(guestVehicleId)}`,
    payload
  );
  return res.data;
}

/* Release vehicle */
export async function releaseVehicle(
  guestVehicleId: string
) {
  const res = await api.patch(
    `/guest-vehicle/guest-vehicle/${encodeURIComponent(guestVehicleId)}/release`
  );
  return res.data;
}

// import api from "./apiClient";

// /* Guests who are checked in but have no vehicle */
// export async function getGuestsWithoutVehicle() {
//   const res = await api.get("/guests/checked-in-without-vehicle");
//   return res.data;
// }

// /* Vehicles that can be assigned */
// export async function getAssignableVehicles() {
//   const res = await api.get("/vehicles/assignable");
//   return res.data;
// }

// /* Assign vehicle to guest */
// export async function assignVehicleToGuest(payload: {
//   guest_id: number;
//   vehicle_no: string;
//   location?: string;
// }) {
//   const res = await api.post("/guest-vehicle/assign", payload);
//   return res.data;
// }

// /* Vehicle fleet with status (main page list) */
// export async function getVehicleFleet() {
//   const res = await api.get("/vehicles/with-assignment-status");
//   return res.data;
// }
