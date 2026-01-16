import api from '@/api/apiClient';
import {
  Messenger,
  MessengerTableQuery,
  MessengerTableResponse,
  CreateMessengerPayload,
  UpdateMessengerPayload,
} from '@/types/messenger';

/* ---------- TABLE ---------- */
export async function getMessengerTable(
  query: MessengerTableQuery
): Promise<MessengerTableResponse> {
  const res = await api.get('/messenger/table', { params: query });
  return res.data;
}

/* ---------- CREATE ---------- */
export async function createMessenger(
  payload: CreateMessengerPayload
): Promise<Messenger> {
  const res = await api.post('/messenger', payload);
  return res.data;
}

/* ---------- UPDATE ---------- */
export async function updateMessenger(
  id: string,
  payload: UpdateMessengerPayload
): Promise<Messenger> {
  const res = await api.put(`/messenger/${id}`, payload);
  return res.data;
}

/* ---------- SOFT DELETE ---------- */
export async function softDeleteMessenger(
  id: string
): Promise<{ messenger_id: string; is_active: boolean }> {
  const res = await api.delete(`/messenger/${id}`);
  return res.data;
}
