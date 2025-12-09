import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export async function getActiveGuests() {
  const res = await apiGet("/guests");

  return res.data.map((g: any) => ({
    id: g.guest_id || g.id || "",
    name: g.guest_name || g.name || "",
    designation: g.designation || "",
    department: g.department || "",
    category: g.category || "",
    status: g.status || g.current_status || "",
    arrival: g.arrival || g.arrival_date || "",
    departure: g.departure || g.departure_date || "",
    room: g.room_no || g.room || "",
    vehicle: g.vehicle_no || g.vehicle || "",
  }));
}


export function getAllGuests() {
  return apiGet("/guests/all");
}

export function createGuest(data: any, user = "system") {
  return apiPost("/guests", data, user);
}

export function updateGuest(name: string, data: any, user = "system") {
  return apiPut(`/guests/${encodeURIComponent(name)}`, data, user);
}

export function softDeleteGuest(name: string, user = "system") {
  return apiDelete(`/guests/${encodeURIComponent(name)}`, user);
}
