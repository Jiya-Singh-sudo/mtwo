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
export interface GuestNetworkRow {
  guest_id: string;
  guest_name: string;

  room_id: string | null;

  /* -------- Network -------- */
  guest_network_id: string | null;
  network_id: string | null;
  network_name: string | null;
  network_status: string | null;

  /* -------- Messenger -------- */
  guest_messenger_id: string | null;
  messenger_id: string | null;
  messenger_name: string | null;
  messenger_status: string | null;

  requested_at: string | null;
}

export interface GuestNetworkTableResponse {
  data: GuestNetworkRow[];
  totalCount: number;
}

export interface CloseGuestNetworkPayload {
  end_date: string;        // YYYY-MM-DD
  end_time: string;        // HH:mm:ss (or HH:mm)
  end_status: string;      // e.g. "Completed" | "Cancelled"
  network_status: string;  // e.g. "Closed" | "Disconnected"
  remarks?: string;
}

/* ======================================================
   TABLE QUERY + RESPONSE
====================================================== */
export interface GuestNetworkTableQuery {
  page: number;
  limit: number;

  search?: string;

  sortBy?: 'guest_name' | 'network_status' | 'messenger_status' | 'requested_at';
  sortOrder?: 'asc' | 'desc';
  status?: 'Requested' | 'Entered' | 'CheckedIn' | 'Closed' | 'All';

}

// export type GuestNetworkTableQuery = {
//   page: number;
//   limit: number;

//   search?: string;

//   sortBy?: 'start_date' | 'guest_name' | 'provider_name' | 'network_status';
//   sortOrder?: 'asc' | 'desc';

//   network_status?: GuestNetwork['network_status'];

//   startDateFrom?: string;
//   startDateTo?: string;
// };

