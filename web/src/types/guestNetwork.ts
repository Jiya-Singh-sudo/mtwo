export interface GuestNetwork {
  guest_network_id: string;

  guest_id: string;
  provider_id: string;
  room_id?: string | null;

  network_zone_from?: string | null;
  network_zone_to?: string | null;

  start_date: string;
  start_time: string;

  end_date?: string | null;
  end_time?: string | null;

  start_status: "Waiting" | "Success";
  end_status: "Waiting" | "Success";

  network_status:
    | "Requested"
    | "Connected"
    | "Disconnected"
    | "Issue-Reported"
    | "Resolved"
    | "Cancelled";

  description?: string | null;
  remarks?: string | null;

  is_active: boolean;

  inserted_at: string;
  inserted_by?: string | null;
  inserted_ip?: string | null;

  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

export interface GuestNetworkCreateDto {
  guest_id: string;
  provider_id: string;
  room_id?: string;

  network_zone_from?: string;
  network_zone_to?: string;

  start_date: string;
  start_time: string;

  end_date?: string;
  end_time?: string;

  start_status?: "Waiting" | "Success";
  end_status?: "Waiting" | "Success";

  network_status?: GuestNetwork["network_status"];

  description?: string;
  remarks?: string;
}

export interface GuestNetworkUpdateDto {
  provider_id?: string;
  room_id?: string;

  network_zone_from?: string;
  network_zone_to?: string;

  start_date?: string;
  start_time?: string;

  end_date?: string;
  end_time?: string;

  start_status?: "Waiting" | "Success";
  end_status?: "Waiting" | "Success";

  network_status?: GuestNetwork["network_status"];

  description?: string;
  remarks?: string;

  is_active?: boolean;
}
