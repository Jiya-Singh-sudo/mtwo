import api from "./apiClient";

/* Guests who are checked in but have no vehicle */
export async function getGuestsWithoutVehicle() {
  const res = await api.get("/guests/checked-in-without-vehicle");
  return res.data;
}

/* Vehicles that can be assigned */
export async function getAssignableVehicles() {
  const res = await api.get("/vehicles/assignable");
  return res.data;
}

/* Assign vehicle to guest */
export async function assignVehicleToGuest(payload: {
  guest_id: number;
  vehicle_no: string;
  location?: string;
}) {
  const res = await api.post("/guest-vehicle/assign", payload);
  return res.data;
}

/* Vehicle fleet with status (main page list) */
export async function getVehicleFleet() {
  const res = await api.get("/vehicles/with-assignment-status");
  return res.data;
}
