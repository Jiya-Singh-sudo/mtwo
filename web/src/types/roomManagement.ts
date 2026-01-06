export type RoomRow = {
  roomId: number;
  roomNo: string;
  roomName?: string;
  residenceType?: string;
  capacity?: number;
  status: 'Available' | 'Occupied';

  guest?: {
    guestId: string;
    guestName: string;
    guestRoomId: string;
  } | null;

  housekeeping?: {
    guestHkId: string;
    hkId: string;
    hkName: string;
    status: string;
  } | null;
};
