import api from './apiClient';
import type { RoomRow, EditRoomFullPayload } from '../types/roomManagement';

type RoomOverviewResponse = {
  data: RoomRow[];
  totalCount: number;
  stats: {
    total: number;
    available: number;
    occupied: number;
    withGuest: number;
    withHousekeeping: number;
  };
};

export async function getRoomManagementOverview(params: {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  status?: "Available" | "Occupied";
  entryDateFrom?: string;
  entryDateTo?: string;
}) : Promise<RoomOverviewResponse> {
  const res = await api.get("/room-management/overview", { params });
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