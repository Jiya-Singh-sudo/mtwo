import api from "./apiClient";
import { AssignGuestVehiclePayload } from "../types/guestVehicle";
import { AssignGuestDriverPayload } from "../types/guestDriver";
import { GuestDriverCreateDto } from "../types/guestDriver";
import { TableQuery } from "@/types/table";
/* =======================
   GUEST TRANSPORT — TABLE
   ======================= */
export async function getGuestTransportTable(query: TableQuery) {
  const cleanParams = Object.fromEntries(
    Object.entries(query).filter(
      ([_, v]) => v !== "" && v !== undefined && v !== null
    )
  );

  const res = await api.get("/guest-transport/table", {
  // const res = await api.get("/guests/active", {
    params: cleanParams,
  });

  return {
    data: res.data.data,
    totalCount: res.data.totalCount,
  };
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

/* =======================
   READ — BASE GUEST LIST
   ======================= */
export async function getActiveGuests(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const res = await api.get("/guests/active", { params });
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
  const res = await api.get("/drivers/available");
  return res.data;
}

/* =======================
   DRIVER — WRITE
   ======================= */
// Assign driver (creates trip)
// export async function assignDriverToGuest(payload: {
//   guest_id: string;
//   driver_id: string;
//   pickup_location: string;
//   drop_location: string;
//   trip_date: string;
//   start_time: string;
//   end_time?: string | null;
//   trip_status?: string;
// }) {
//   const res = await api.post("/guest-driver/assign", payload);
//   return res.data;
// }

export async function assignDriverToGuest(payload: {
  guest_id: string;
  driver_id: string;
  pickup_location?: string;
  drop_location?: string;
  trip_date: string;
  start_time: string;
  end_time?: string;
  trip_status?: string;
}) {
  const cleanPayload = {
    ...payload,
    drop_location: payload.drop_location || undefined,
    end_time: payload.end_time || undefined,
  };

  const res = await api.post("/guest-driver/assign", cleanPayload);
  return res.data;
}


// Unassign driver
export async function unassignDriver(guestDriverId: string) {
  const res = await api.delete(`/guest-driver/${guestDriverId}`);
  return res.data;
}

/* =======================
   DRIVER — UPDATE
   ======================= */
export async function updateDriverTrip(
  guestDriverId: string,
  payload: Partial<AssignGuestDriverPayload>
) {
  const res = await api.patch(`/guest-driver/editTripStatus/${guestDriverId}`, payload);
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
  const res = await api.patch(
    `/guest-vehicle/guest-vehicle/${guestVehicleId}/release`
  );
  return res.data;
}

/* =======================
   VEHICLE — UPDATE
   ======================= */
export async function updateVehicleAssignment(
  guestVehicleId: string,
  payload: Partial<AssignGuestVehiclePayload>
) {
  const res = await api.patch(`/guest-vehicle/editVehicleAssignment/${guestVehicleId}`, payload);
  return res.data;
}
