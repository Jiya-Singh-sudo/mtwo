import api, { safeGet } from "../apiClient";
import type { UserCreateDto, UserUpdateDto, UserLoginDto } from "../../types/users";

// GET active users
export async function getActiveUsers() {
  return safeGet<any[]>("/users");
}

// GET all users (inactive included)
export async function getAllUsers() {
  return safeGet<any[]>("/users/all");
}

// CREATE user (backend auto-generates user_id + hashes password)
export async function createUser(
  data: UserCreateDto,
  user = "system"
) {
  const res = await api.post("/users", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE user (via username)
export async function updateUser(
  username: string,
  data: UserUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/users/${encodeURIComponent(username)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE user (via username)
export async function softDeleteUser(
  username: string,
  user = "system"
) {
  const res = await api.delete(
    `/users/${encodeURIComponent(username)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// LOGIN (backend hashes password, validates, updates last_login)
export async function loginUser(data: UserLoginDto) {
  const res = await api.post("/users/login", data);
  return res.data;
}
