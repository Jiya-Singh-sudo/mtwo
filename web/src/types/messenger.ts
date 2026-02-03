/* ======================================================
   CORE ENTITY
====================================================== */

export type Messenger = {
  messenger_id: string;
  messenger_name: string;
  messenger_name_local_language?: string;
  primary_mobile: string;
  secondary_mobile?: string;
  email?: string;
  designation?: string;
  remarks?: string;
  is_active: boolean;
  inserted_at: string;
  updated_at?: string;
};

/* ======================================================
   CREATE / UPDATE
====================================================== */

export type CreateMessengerPayload = {
  messenger_name: string;
  messenger_name_local_language?: string;
  primary_mobile: string;
  secondary_mobile?: string;
  email?: string;
  designation?: string;
  remarks?: string;
};

export type UpdateMessengerPayload = Partial<CreateMessengerPayload> & {
  is_active?: boolean;
};

/* ======================================================
   TABLE QUERY + RESPONSE
====================================================== */

export type MessengerTableQuery = {
  page: number;
  limit: number;

  search?: string;

  sortBy?: 'messenger_name' | 'primary_mobile' | 'designation' | 'inserted_at';
  sortOrder?: 'asc' | 'desc';

  status?: 'active' | 'inactive';
};

export type MessengerTableResponse = {
  data: Messenger[];
  totalCount: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    assigned: number;
    unassigned: number;
  };
};
