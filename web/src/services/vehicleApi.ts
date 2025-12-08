import { API_BASE_URL } from "../config/api";

// GET ACTIVE ROLES ONLY
export async function getRoles() {
  const res = await fetch(`${API_BASE_URL}/vehicles`);
  return res.json();
}

// GET ACTIVE + INACTIVE
export async function getAllRoles() {
  const res = await fetch(`${API_BASE_URL}/vehicles/all`);
  return res.json();
}

// CREATE ROLE
export async function createVehicle(data: {
    vehicle_no:string;
    vehicle_name: string;
    model: string;
    manufacturing: string;
    capacity: number;
    color: string;
}) {
  const res = await fetch(`${API_BASE_URL}/vehicles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user": "admin",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

// UPDATE ROLE
export async function updateVehicle(vehicle_no: string, data: any) {
  const res = await fetch(`${API_BASE_URL}/vehicles/${vehicle_no}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user": "admin",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

// SOFT DELETE ROLE
export async function deleteVehicles(vehicle_no: string) {
  const res = await fetch(`${API_BASE_URL}/vehicles/${vehicle_no}`, {
    method: "DELETE",
    headers: {
      "x-user": "admin",
    },
  });

  return res.json();
}
