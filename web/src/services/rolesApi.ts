import { API_BASE_URL } from "../config/api";

// GET ACTIVE ROLES ONLY
export async function getRoles() {
  const res = await fetch(`${API_BASE_URL}/roles`);
  return res.json();
}

// GET ACTIVE + INACTIVE
export async function getAllRoles() {
  const res = await fetch(`${API_BASE_URL}/roles/all`);
  return res.json();
}

// CREATE ROLE
export async function createRole(data: {
  role_name: string;
  role_desc: string;
}) {
  const res = await fetch(`${API_BASE_URL}/roles`, {
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
export async function updateRole(role_id: string, data: any) {
  const res = await fetch(`${API_BASE_URL}/roles/${role_id}`, {
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
export async function deleteRole(role_id: string) {
  const res = await fetch(`${API_BASE_URL}/roles/${role_id}`, {
    method: "DELETE",
    headers: {
      "x-user": "admin",
    },
  });

  return res.json();
}
