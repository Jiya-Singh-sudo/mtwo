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

  return res.data.map((r: any) => ({
    ...r,

    // Monday
    monday_in_time: r.monday_duty_in_time,
    monday_out_time: r.monday_duty_out_time,

    // Tuesday
    tuesday_in_time: r.tuesday_duty_in_time,
    tuesday_out_time: r.tuesday_duty_out_time,

    // Wednesday
    wednesday_in_time: r.wednesday_duty_in_time,
    wednesday_out_time: r.wednesday_duty_out_time,

    // Thursday
    thursday_in_time: r.thursday_duty_in_time,
    thursday_out_time: r.thursday_duty_out_time,

    // Friday
    friday_in_time: r.friday_duty_in_time,
    friday_out_time: r.friday_duty_out_time,

    // Saturday
    saturday_in_time: r.saturday_duty_in_time,
    saturday_out_time: r.saturday_duty_out_time,

    // Sunday
    sunday_in_time: r.sunday_duty_in_time,
    sunday_out_time: r.sunday_duty_out_time,
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
  roaster_id: string,
  payload: DriverDutyRoasterUpdateDto
): Promise<DriverDutyRoaster> {
  const res = await api.put(`/driver-duty-roaster/${roaster_id}`, payload);
  return res.data.map((r: any) => ({
    ...r,
    roaster_id: r.duty_roaster_id, 
  }));
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
