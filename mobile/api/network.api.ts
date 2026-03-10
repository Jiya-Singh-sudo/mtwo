import api from '@/api/apiClient';
import {
  NetworkProvider,
  NetworkTableQuery,
  NetworkTableResponse,
  CreateNetworkPayload,
  UpdateNetworkPayload,
} from '@/types/network';

/* ---------- TABLE ---------- */
export async function getNetworkTable(
  query: NetworkTableQuery
): Promise<NetworkTableResponse> {
  const res = await api.get('/wifi-providers/table', { params: query });
  return res.data;
}

/* ---------- CREATE ---------- */
export async function createNetwork(
  payload: CreateNetworkPayload
): Promise<NetworkProvider> {
  const res = await api.post('/wifi-providers', payload);
  return res.data;
}

/* ---------- UPDATE ---------- */
export async function updateNetwork(
  id: string,
  payload: UpdateNetworkPayload
): Promise<NetworkProvider> {
  const res = await api.put(`/wifi-providers/${id}`, payload);
  return res.data;
}

/* ---------- SOFT DELETE ---------- */
export async function softDeleteNetwork(
  id: string
): Promise<{ provider_id: string; is_active: boolean }> {
  const res = await api.delete(`/wifi-providers/${id}`);
  return res.data;
}
