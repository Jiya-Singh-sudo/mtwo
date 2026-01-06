import api from './apiClient';
import type { RoomRow } from '../types/roomManagement';

export async function getRoomManagementOverview(): Promise<RoomRow[]> {
  const res = await api.get('/room-management/overview');
  return res.data;
}
