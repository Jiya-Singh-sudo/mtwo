/* ======================================================
   CORE ENTITY (TABLE VIEW)
====================================================== */

export type GuestNetwork = {
  guest_network_id: string;

  guest_id: string;
  guest_name: string;

  provider_id: string;
  provider_name: string;

  room_no?: string;

  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;

  start_status: 'Waiting' | 'Success';
  end_status: 'Waiting' | 'Success';

  network_status:
    | 'Requested'
    | 'Connected'
    | 'Disconnected'
    | 'Issue-Reported'
    | 'Resolved'
    | 'Cancelled';

  description?: string;
  remarks?: string;

  is_active: boolean;
};

/* ======================================================
   CREATE / UPDATE
====================================================== */

export type CreateGuestNetworkPayload = {
  guest_id: string;
  provider_id: string;
  room_id?: string;

  network_zone_from?: string;
  network_zone_to?: string;

  start_date: string;
  start_time: string;

  end_date?: string;
  end_time?: string;

  start_status?: 'Waiting' | 'Success';
  end_status?: 'Waiting' | 'Success';

  network_status?: GuestNetwork['network_status'];

  description?: string;
  remarks?: string;
};

export type UpdateGuestNetworkPayload = Partial<CreateGuestNetworkPayload> & {
  is_active?: boolean;
};

/* ======================================================
   TABLE QUERY + RESPONSE
====================================================== */

export type GuestNetworkTableQuery = {
  page: number;
  limit: number;

  search?: string;

  sortBy?: 'start_date' | 'guest_name' | 'provider_name' | 'network_status';
  sortOrder?: 'asc' | 'desc';

  network_status?: GuestNetwork['network_status'];

  startDateFrom?: string;
  startDateTo?: string;
};

export type GuestNetworkTableResponse = {
  data: GuestNetwork[];
  totalCount: number;
};
