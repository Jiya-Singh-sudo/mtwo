import { safeGet, safePost, safePatch, safeDelete } from './httpHelpers';

export type PaginatedResponse<T> = {
  data: T[];
  totalCount: number;
};

export async function getActiveGuests(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  entryDateFrom?: string;
  entryDateTo?: string;
}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.append(key, String(value));
    }
  });

  return safeGet(`/guests/active?${query.toString()}`);
}

export async function createGuest(payload: { guest: any; designation?: any; inout?: any }) {
  return safePost('/guests', payload);
}

export async function updateGuest(id: number | string, payload: any) {
  return safePatch(`/guests/${id}`, payload);
}

export async function softDeleteGuest(id: number | string) {
  return safeDelete(`/guests/${id}`);
}
