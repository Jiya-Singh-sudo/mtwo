import api, { safeGet } from "./apiClient";
import type { WifiProviderCreateDto, WifiProviderUpdateDto } from "../types/network";

// GET active providers
export async function getActiveWifiProviders() {
  return safeGet<any[]>("/wifi-provider");
}

// GET all
export async function getAllWifiProviders() {
  return safeGet<any[]>("/wifi-provider/all");
}

// CREATE
export async function createWifiProvider(
  data: WifiProviderCreateDto,
  user = "system"
) {
  const res = await api.post("/wifi-provider", data, {
    headers: { "x-user": user }
  });
  return res.data;
}

// UPDATE (by provider_name)
export async function updateWifiProvider(
  providerName: string,
  data: WifiProviderUpdateDto,
  user = "system"
) {
  const res = await api.put(
    `/wifi-provider/${encodeURIComponent(providerName)}`,
    data,
    { headers: { "x-user": user } }
  );
  return res.data;
}

// SOFT DELETE
export async function softDeleteWifiProvider(
  providerName: string,
  user = "system"
) {
  const res = await api.delete(
    `/wifi-provider/${encodeURIComponent(providerName)}`,
    { headers: { "x-user": user } }
  );
  return res.data;
}
