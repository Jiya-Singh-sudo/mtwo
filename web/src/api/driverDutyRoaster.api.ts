import axios from "axios";
import {
  DriverDutyRoaster,
  DriverDutyRoasterCreateDto,
  DriverDutyRoasterUpdateDto
} from "@/types/driverDutyRoaster";

/* -------------------------------------------------
   BASE CONFIG
------------------------------------------------- */

const API_BASE = "/api/driver-duty-roaster";

/* -------------------------------------------------
   GET – Active roasters only
------------------------------------------------- */

export async function getActiveDriverDutyRoasters(): Promise<DriverDutyRoaster[]> {
  const res = await axios.get(API_BASE);
  return res.data;
}

/* -------------------------------------------------
   GET – All (active + inactive)
------------------------------------------------- */

export async function getAllDriverDutyRoasters(): Promise<DriverDutyRoaster[]> {
  const res = await axios.get(`${API_BASE}/all`);
  return res.data;
}

/* -------------------------------------------------
   GET – Single roaster by ID
------------------------------------------------- */

export async function getDriverDutyRoasterById(
  roaster_id: string
): Promise<DriverDutyRoaster> {
  const res = await axios.get(`${API_BASE}/${roaster_id}`);
  return res.data;
}

/* -------------------------------------------------
   POST – Create
------------------------------------------------- */

export async function createDriverDutyRoaster(
  payload: DriverDutyRoasterCreateDto
): Promise<DriverDutyRoaster> {
  const res = await axios.post(API_BASE, payload);
  return res.data;
}

/* -------------------------------------------------
   PUT – Update
------------------------------------------------- */

export async function updateDriverDutyRoaster(
  roaster_id: string,
  payload: DriverDutyRoasterUpdateDto
): Promise<DriverDutyRoaster> {
  const res = await axios.put(`${API_BASE}/${roaster_id}`, payload);
  return res.data;
}

/* -------------------------------------------------
   POST – Soft Delete (if enabled)
------------------------------------------------- */

export async function softDeleteDriverDutyRoaster(
  roaster_id: string
): Promise<{ success: boolean }> {
  const res = await axios.post(`${API_BASE}/${roaster_id}/soft-delete`);
  return res.data;
}
