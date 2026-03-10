export interface GuestHousekeeping {
  guest_hk_id: string;

  hk_id: string;
  // room_id: string;
  guest_id: string;
  status: "Assigned" | "Completed" | "Cancelled";
  remarks?: string;
  is_active: boolean;
}

export interface GuestHousekeepingCreateDto {
  hk_id: string;
  room_id: string;
  // guest_id: string;
  remarks?: string;
}

export interface GuestHousekeepingUpdateDto {
  hk_id?: string;
  status?: "Assigned" | "Completed" | "Cancelled";
  remarks?: string;
  is_active?: boolean;
}
