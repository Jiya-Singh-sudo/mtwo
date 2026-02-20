import api from '@/api/apiClient';
import {
  GuestNetwork,
  GuestNetworkTableQuery,
  GuestNetworkTableResponse,
  CreateGuestNetworkPayload,
  CloseGuestNetworkPayload,
} from '@/types/guestNetwork';

/* ---------- TABLE ---------- */
export async function getGuestNetworkTable(
  query: GuestNetworkTableQuery
): Promise<GuestNetworkTableResponse> {
  const res = await api.get('/guest-network/table', { params: query });
  return res.data;
}
export async function getActiveProviders() {
  const res = await api.get('/guest-network/active-providers');
  return res.data;
}

/* ---------- CREATE ---------- */
export async function createGuestNetwork(
  payload: CreateGuestNetworkPayload
): Promise<GuestNetwork> {
  const res = await api.post('/guest-network', payload);
  return res.data;
}

/* ---------- UPDATE ---------- */
export async function updateGuestNetwork(
  id: string,
  payload: any // UpdateGuestNetworkPayload
): Promise<GuestNetwork> {
  const res = await api.put(`/guest-network/${id}`, payload);
  return res.data;
}
export async function closeGuestNetwork(
  id: string,
  payload: CloseGuestNetworkPayload
) {
  const res = await api.post(`/guest-network/${id}/close`, payload);
  return res.data;
}

/* ---------- SOFT DELETE ---------- */
export async function softDeleteGuestNetwork(
  id: string
): Promise<{ guest_network_id: string; is_active: boolean }> {
  const res = await api.delete(`/guest-network/${id}`);
  return res.data;
}
