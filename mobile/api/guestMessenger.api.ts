import api from '@/api/apiClient';
import { GuestMessenger, GuestMessengerTableQuery, GuestMessengerTableResponse, CreateGuestMessengerPayload, UnassignGuestMessengerPayload,} from '@/types/guestMessenger';
import { GuestNetworkTableQuery, GuestNetworkTableResponse } from '@/types/guestNetwork';

/* ======================================================
   TABLE (DATATABLE)
====================================================== */

export async function getGuestMessengerTable(
  query: GuestMessengerTableQuery
): Promise<GuestMessengerTableResponse> {
  const res = await api.get('/guest-messenger/table', {
    params: query,
  });
  return res.data;
}

/* ======================================================
   CREATE
====================================================== */

export async function createGuestMessenger(
  payload: CreateGuestMessengerPayload
): Promise<GuestMessenger> {
  const res = await api.post('/guest-messenger/assign', payload);
  return res.data;
}

/* ======================================================
   UPDATE
====================================================== */

// export async function updateGuestMessenger(
//   id: string,
//   payload: UpdateGuestMessengerPayload
// ): Promise<GuestMessenger> {
//   const res = await api.put(`/guest-messenger/${id}`, payload);
//   return res.data;
// }

/* ======================================================
   UNASSIGN
====================================================== */
export async function unassignGuestMessenger(
  id: string,
  payload?: UnassignGuestMessengerPayload
) {
  const res = await api.post(`/guest-messenger/${id}/unassign`, payload);
  return res.data;
}

export const getGuestNetworkTable = async (
  params: GuestNetworkTableQuery,
): Promise<GuestNetworkTableResponse> => {
  const res = await api.get('/guest-network/table', {
    params,
  });

  return res.data;
};

/* ======================================================
   SOFT DELETE
====================================================== */

export async function softDeleteGuestMessenger(
  id: string
): Promise<{ guest_messenger_id: string; is_active: boolean }> {
  const res = await api.delete(`/guest-messenger/${id}`);
  return res.data;
}
