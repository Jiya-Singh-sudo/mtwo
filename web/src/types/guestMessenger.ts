/* ======================================================
   CORE ENTITY
====================================================== */

export type GuestMessenger = {
  guest_messenger_id: string;

  guest_id: string;
  guest_name: string;

  messenger_id: string;
  messenger_name: string;

  assignment_date: string; // YYYY-MM-DD

  remarks?: string;

  is_active: boolean;
};

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

export type CreateGuestMessengerPayload = {
  guest_id: string;
  messenger_id: string;
  assignment_date: string; // YYYY-MM-DD
  remarks?: string;
};

export type UpdateGuestMessengerPayload = {
  remarks?: string;
  is_active?: boolean;
};

/* ======================================================
   TABLE QUERY (matches backend DTO)
====================================================== */

export type GuestMessengerTableQuery = {
  page: number;
  limit: number;

  search?: string;

  sortBy?: 'assignment_date' | 'guest_name' | 'messenger_name';
  sortOrder?: 'asc' | 'desc';

  status?: 'active' | 'inactive';
};

/* ======================================================
   TABLE RESPONSE
====================================================== */

export type GuestMessengerTableResponse = {
  data: GuestMessenger[];
  totalCount: number;
};
