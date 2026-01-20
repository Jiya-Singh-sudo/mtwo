// web/src/services/roles.ts
import api, { safeGet } from "../api/apiClient";
import { Role } from "@/types/userManagement.types";

export async function getActiveRoles() {
  return safeGet<Role[]>("/roles");
}
