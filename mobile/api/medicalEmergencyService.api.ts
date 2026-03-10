import { safeGet, safePost, safePatch, safeDelete } from './httpHelpers';

export type PaginatedResponse<T> = {
  data: T[];
  totalCount: number;
};

/* =========================
   GET (Data Table Version)
========================= */

export async function getMedicalEmergencyServices(params: {
  page: number;
  limit: number;
  search?: string;
  serviceType?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.append(key, String(value));
    }
  });

  return safeGet(`/medical-emergency-service?${query.toString()}`);
}

/* =========================
   CREATE
========================= */

export async function createMedicalEmergencyService(payload: {
  service_id: string;
  service_provider_name: string;
  service_provider_name_local_language?: string;
  service_type: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  address_line?: string;
  distance_from_guest_house?: string;
  is_active?: boolean;
}) {
  return safePost('/medical-emergency-service', payload);
}

/* =========================
   UPDATE
========================= */

export async function updateMedicalEmergencyService(
  id: string,
  payload: Partial<{
    service_provider_name: string;
    service_provider_name_local_language: string;
    service_type: string;
    mobile: string;
    alternate_mobile: string;
    email: string;
    address_line: string;
    distance_from_guest_house: string;
    is_active: boolean;
  }>
) {
  return safePatch(`/medical-emergency-service/${id}`, payload);
}

/* =========================
   SOFT DELETE
========================= */

export async function softDeleteMedicalEmergencyService(id: string) {
  return safeDelete(`/medical-emergency-service/${id}`);
}
