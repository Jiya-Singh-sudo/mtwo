import { ActiveGuestRow } from "./guests";
import { ActiveGuestDriver } from "./guestDriver";
import { ActiveGuestVehicle } from "./guestVehicle";

export interface GuestTransportRow {
  guest: ActiveGuestRow;

  driver: ActiveGuestDriver | null;
  vehicle: ActiveGuestVehicle | null;
}
