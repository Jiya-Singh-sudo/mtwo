import { safeGet, safePost, safePatch, safeDelete } from './httpHelpers';

export type PaginatedResponse<T> = {
  data: T[];
  totalCount: number;
};

/* =========================
   GET (Data Table Version)
========================= */

export async function getLiasoningOfficers(params: {
  page: number;
  limit: number;
  search?: string;
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

  return safeGet(`/liasoning-officer?${query.toString()}`);
}

/* =========================
   CREATE
========================= */

export async function createLiasoningOfficer(payload: {
  officer_id: string;
  officer_name: string;
  officer_name_local_language?: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  role_id: string;
  department?: string;
  designation?: string;
  is_active?: boolean;
}) {
  return safePost('/liasoning-officer', payload);
}

/* =========================
   UPDATE
========================= */

export async function updateLiasoningOfficer(
  id: string,
  payload: Partial<{
    officer_name: string;
    officer_name_local_language: string;
    mobile: string;
    alternate_mobile: string;
    email: string;
    role_id: string;
    department: string;
    designation: string;
    is_active: boolean;
  }>
) {
  return safePatch(`/liasoning-officer/${id}`, payload);
}

/* =========================
   SOFT DELETE
========================= */

export async function softDeleteLiasoningOfficer(id: string) {
  return safeDelete(`/liasoning-officer/${id}`);
}
