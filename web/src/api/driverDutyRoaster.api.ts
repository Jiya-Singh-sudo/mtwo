import {
  DriverDutyRoaster,
  DriverDutyRoasterRow,
  DriverDutyRoasterCreateDto,
  DriverDutyRoasterUpdateDto
} from "@/types/driverDutyRoaster";
import api from "./apiClient";


/* -------------------------------------------------
   BASE CONFIG
------------------------------------------------- */

// const API_BASE_ = "/driver-duty-roaster";
export async function getDriverRoasterWithDrivers(): Promise<DriverDutyRoasterRow[]> {
  const res = await api.get("/driver-duty-roaster/driver-duties");

  return res.data.map((row: any) => ({
    ...row,
    roaster_id: row.duty_roaster_id, // ← THIS LINE IS CRITICAL
  }));
}




/* -------------------------------------------------
   GET – Active roasters only
------------------------------------------------- */

export async function getActiveDriverDutyRoasters(): Promise<DriverDutyRoaster[]> {
  const res = await api.get("/driver-duty-roaster");
  return res.data;
}

/* -------------------------------------------------
   GET – All (active + inactive)
------------------------------------------------- */

export async function getAllDriverDutyRoasters(): Promise<DriverDutyRoaster[]> {
  const res = await api.get("/driver-duty-roaster/all");
  return res.data;
}

/* -------------------------------------------------
   GET – Single roaster by ID
------------------------------------------------- */

export async function getDriverDutyRoasterById(
  roaster_id: string
): Promise<DriverDutyRoaster> {
  const res = await api.get(`/driver-duty-roaster/${roaster_id}`);
  return res.data;
}

/* -------------------------------------------------
   POST – Create
------------------------------------------------- */

export async function createDriverDutyRoaster(
  payload: DriverDutyRoasterCreateDto
): Promise<DriverDutyRoaster> {
  const res = await api.post("/driver-duty-roaster", payload);
  return res.data;
}

/* -------------------------------------------------
   PUT – Update
------------------------------------------------- */

export async function updateDriverDutyRoaster(
  id: string,
  payload: DriverDutyRoasterUpdateDto
): Promise<DriverDutyRoasterRow> {
  const res = await api.put(`/driver-duty-roaster/${id}`, payload);
  return res.data;
}

/* -------------------------------------------------
   POST – Soft Delete (if enabled)
------------------------------------------------- */

export async function softDeleteDriverDutyRoaster(
  roaster_id: string
): Promise<{ success: boolean }> {
  const res = await api.post(`/driver-duty-roaster/${roaster_id}/soft-delete`);
  return res.data;
}
