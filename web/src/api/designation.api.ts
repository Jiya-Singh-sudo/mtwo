import api, { safeGet } from "./apiClient";
import type { DesignationCreateDto, DesignationUpdateDto } from "../types/designation";

export async function getActiveDesignations() {
  return safeGet<any[]>("/designations");
}

export async function getAllDesignations() {
  return safeGet<any[]>("/designations/all");
}

export async function createDesignation(
  data: DesignationCreateDto,
  user = "system"
) {
  const res = await api.post("/designations", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

export async function updateDesignation(
  designationName: string,
  data: DesignationUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/designations/${encodeURIComponent(designationName)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

export async function softDeleteDesignation(
  designationName: string,
  user = "system"
) {
  const res = await api.delete(
    `/designations/${encodeURIComponent(designationName)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
