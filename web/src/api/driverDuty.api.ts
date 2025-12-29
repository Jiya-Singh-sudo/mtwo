import api from './apiClient';// or wherever your api instance lives
import {
  DriverDuty,
  CreateDriverDutyPayload,
  UpdateDriverDutyPayload,
} from '@/types/driverDuty';

/* ================= CREATE ================= */

export async function createDriverDuty(
  payload: CreateDriverDutyPayload,
): Promise<DriverDuty> {
  const res = await api.post('/driver-duty', payload);
  return res.data;
}

/* ================= UPDATE ================= */

export async function updateDriverDuty(
  dutyId: string,
  payload: UpdateDriverDutyPayload,
): Promise<DriverDuty> {
  const res = await api.put(`/driver-duty/${dutyId}`, payload);
  return res.data;
}

/* ================= READ ================= */

export async function getDriverDutyById(
  dutyId: string,
): Promise<DriverDuty> {
  const res = await api.get(`/driver-duty/${dutyId}`);
  return res.data;
}

/**
 * Fetch duties by date range
 * Example:
 * getDriverDutiesByRange('2025-03-01', '2025-03-07')
 */
export async function getDriverDutiesByRange(from: string, to: string) {
  const res = await api.get(
    `/driver-duty/range?from=${from}&to=${to}`
  );
  return res.data;
}


/**
 * Fetch duties for a specific driver
 */
export async function getDriverDutiesByDriver(
  driverId: string,
  from: string,
  to: string,
): Promise<DriverDuty[]> {
  const res = await api.get(`/driver-duty/driver/${driverId}`, {
    params: { from, to },
  });
  return res.data;
}
