export type RoomRow = {
  roomId: string;
  roomNo: string;
  roomName?: string;
  buildingName?: string;
  residenceType?: string;
  roomType?: string;
  roomCategory?: string;
  roomCapacity?: number;
  status: "Available" | "Occupied";

  guest?: {
    guestRoomId: string;
    guestId: string;
    guestName: string;
    checkInDate?: string;
    checkOutDate?: string;
  } | null;

  housekeeping?: {
    guestHkId: string;
    hkId: string;
    hkName: string;
    taskDate?: string;
    taskShift?: "Morning" | "Evening" | "Night" | "Full-Day";
    isActive?: boolean;
  } | null;
};
export type EditRoomFullPayload = {
  // room fields
  room_no?: string;
  room_name?: string;
  building_name?: string;
  residence_type?: string;
  room_type?: string;
  room_capacity?: number;
  room_category?: string;
  status?: "Available" | "Occupied";

  // guest assignment
  guest_id?: string | null;
  action_type:
    | "Room-Allocated"
    | "Room-Changed"
    | "Room-Upgraded"
    | "Room-Downgraded"
    | "Extra-Bed-Added"
    | "Room-Shifted"
    | "Room-Released"
    | "Other";
  action_description?: string;
  action_date?: string;
  action_time?: string;
  remarks?: string;

  // housekeeping assignment
  hk_id?: string | null;
  task_date?: string; // YYYY-MM-DD
  task_shift?: "Morning" | "Evening" | "Night" | "Full-Day";
  service_type?: string;
  admin_instructions?: string;
};
