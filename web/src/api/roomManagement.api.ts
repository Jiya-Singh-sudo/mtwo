import api from './apiClient';
import type { RoomRow, EditRoomFullPayload } from '../types/roomManagement';

type RoomOverviewResponse = {
  data: RoomRow[];
  totalCount: number;
};
export async function getRoomStatusCounts(): Promise<{
  All: number;
  Available: number;
  Occupied: number;
  Reserved: number;
  WithGuest: number;
  WithHousekeeping: number;
}> {
  const res = await api.get("/room-management/status-counts");
  return res.data;
}
export async function getRoomManagementOverview(
  params: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
    status?: "Available" | "Occupied" | "Reserved";
    withGuest?: boolean;
    withHousekeeping?: boolean;
    entryDateFrom?: string;
    entryDateTo?: string;
  },
  options?: { silent?: boolean }
): Promise<RoomOverviewResponse> {
  const config: any = { params };
  if (options?.silent) config.silent = true;

  const res = await api.get("/room-management/overview", config);
  return res.data;
}

export async function updateFullRoom(
  roomId: string,
  payload: EditRoomFullPayload
): Promise<{ success: true }> {
  return api.patch(`/room-management/${roomId}/full`, payload);
}
export async function getAssignableGuests() {
  const res = await api.get('/room-management/assignable-guests');
  return res.data;
}