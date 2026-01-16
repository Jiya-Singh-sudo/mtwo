/* ======================================================
   INFO PACKAGE – TYPES
====================================================== */

/* ---------- Search List Item ---------- */
export interface InfoPackageGuestListItem {
  guest_id: string;
  guest_name: string;
  designation: string | null;
  department: string | null;
  vip_type: string | null;

  room_no: string | null;
  room_type: string | null;

  arrival_date: string;
  departure_date: string;
  stay_status: string;

  vehicle_no: string | null;
  vehicle_name: string | null;
  driver_name: string | null;
}

/* ---------- Search Response ---------- */
export interface InfoPackageGuestSearchResponse {
  data: InfoPackageGuestListItem[];
  total: number;
  page: number;
  limit: number;
}

/* ---------- Aggregated Guest Info ---------- */
export interface InfoPackageGuestInfo {
  guest: {
    guestId: string;
    name: string;
    designation: string | null;
    department: string | null;
    vipType: string | null;
    contactNo: string | null;
  };
  stay: {
    stayId: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    roomNo: string | null;
    roomType: string | null;
  };
  transport: {
    vehicleNo: string | null;
    vehicleName: string | null;
    driverName: string | null;
    driverContact: string | null;
  };
  meta: {
    generatedAt: string;
  };
}

/* ---------- WhatsApp Response ---------- */
export interface InfoPackageWhatsappResponse {
  status: 'sent';
  messageId: string;
}
