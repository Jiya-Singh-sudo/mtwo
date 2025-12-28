import api from "./apiClient";

/* =======================
   READ — BASE GUEST LIST
   ======================= */

export async function getActiveGuests() {
  const res = await api.get("/guests/active");
  return res.data;
}

/* =======================
   DRIVER — READ
   ======================= */

// Active driver for a guest
export async function getActiveDriverByGuest(guestId: string) {
  const res = await api.get(`/guest-driver/active/${guestId}`);
  return res.data; // object | null
}

// Drivers available for assignment
export async function getAssignableDrivers() {
  const res = await api.get("/drivers/assignable");
  return res.data;
}

/* =======================
   DRIVER — WRITE
   ======================= */

// Assign driver (creates trip)
export async function assignDriverToGuest(payload: {
  guest_id: string;
  driver_id: string;
  pickup_location: string;
  trip_date: string;
  start_time: string;
  trip_status?: string;
}) {
  const res = await api.post("/guest-driver/assign", payload);
  return res.data;
}

// Unassign driver
export async function unassignDriver(guestDriverId: string) {
  const res = await api.delete(`/guest-driver/${guestDriverId}`);
  return res.data;
}

/* =======================
   VEHICLE — READ
   ======================= */

// Vehicle assigned to a guest
export async function getVehicleByGuest(guestId: string) {
  const res = await api.get(`/guest-vehicle/by-guest/${guestId}`);
  return res.data; // object | null
}

// Vehicles available for assignment
export async function getAssignableVehicles() {
  const res = await api.get("/vehicles/assignable");
  return res.data;
}

/* =======================
   VEHICLE — WRITE
   ======================= */

// Assign vehicle
export async function assignVehicleToGuest(payload: {
  guest_id: string;
  vehicle_no: string;
  location?: string;
}) {
  const res = await api.post("/guest-vehicle/assign", payload);
  return res.data;
}

// Unassign vehicle
export async function unassignVehicle(guestVehicleId: string) {
  const res = await api.patch(`/guest-vehicle/release/${guestVehicleId}`);
  return res.data;
}
