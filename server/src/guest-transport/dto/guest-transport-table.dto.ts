export class GuestTransportTableQueryDto {
  page: number;
  limit: number;

  search?: string;

  sortBy?: 
    | 'entry_date'
    | 'guest_name'
    | 'driver_name'
    | 'vehicle_no'
    | 'trip_status';

  sortOrder?: 'asc' | 'desc';
}
