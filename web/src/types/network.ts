/* ======================================================
   CORE ENTITY
====================================================== */

export type NetworkProvider = {
  provider_id: string;
  provider_name: string;
  provider_name_local_language?: string;
  network_type: 'WiFi' | 'Broadband' | 'Hotspot' | 'Leased-Line';
  username?: string;
  is_active: boolean;
  inserted_at: string;
  updated_at?: string;
};

/* ======================================================
   CREATE / UPDATE
====================================================== */

export type CreateNetworkPayload = {
  provider_name: string;
  provider_name_local_language?: string;
  network_type: NetworkProvider['network_type'];
  username?: string;
  password?: string;
};

export type UpdateNetworkPayload = Partial<CreateNetworkPayload> & {
  is_active?: boolean;
};

/* ======================================================
   TABLE QUERY + RESPONSE
====================================================== */

export type NetworkTableQuery = {
  page: number;
  limit: number;

  search?: string;

  sortBy?: 'provider_name' | 'network_type' | 'bandwidth_mbps' | 'inserted_at';
  sortOrder?: 'asc' | 'desc';

  status?: "all" | "active" | "inactive" | undefined;
  networkType?: 'WiFi' | 'Broadband' | 'Hotspot' | 'Leased-Line';

};

export type NetworkTableResponse = {
  data: NetworkProvider[];
  totalCount: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    // wifi: number;
    // broadband: number;
    // hotspot: number;
    // leasedLine: number;
  };
};
