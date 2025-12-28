import { useEffect, useState } from "react";
import { Car, UserCheck, X } from "lucide-react";
import "./GuestTransportManagement.css";

import {
  getActiveGuests,
  getActiveDriverByGuest,
  getVehicleByGuest,
  assignDriverToGuest,
  assignVehicleToGuest,
  unassignDriver,
  unassignVehicle,
  getAssignableDrivers,
  getAssignableVehicles
} from "../../../api/guestTravellingAssign.api";

import { GuestTransportRow } from "../../../types/guestTransport";
import { AssignGuestDriverPayload } from "../../../types/guestDriver";
import { AssignGuestVehiclePayload } from "../../../types/guestVehicle";
import { AssignableDriver } from "../../../types/drivers";
import { AssignableVehicle } from "../../../types/vehicles";
import { ActiveGuestRow } from "../../../types/guests";

function GuestTransportManagement() {
  /* =======================
     PAGE STATE
     ======================= */

  const [rows, setRows] = useState<GuestTransportRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* =======================
     ASSIGN DRIVER MODAL
     ======================= */

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [drivers, setDrivers] = useState<AssignableDriver[]>([]);
  const [driverForm, setDriverForm] = useState<AssignGuestDriverPayload>({
    guest_id: "",
    driver_id: "",
    pickup_location: "",
    drop_location: "",
    trip_date: "",
    start_time: "",
    end_time: "",
    trip_status: "Scheduled"
  });

  /* =======================
     ASSIGN VEHICLE MODAL
     ======================= */

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicles, setVehicles] = useState<AssignableVehicle[]>([]);
  const [vehicleForm, setVehicleForm] = useState<AssignGuestVehiclePayload>({
    guest_id: "",
    vehicle_no: "",
    location: ""
  });

  /* =======================
     LOAD GUEST TRANSPORT
     ======================= */

  async function loadGuests() {
    setLoading(true);
    try {
      const guests = await getActiveGuests();

      const rows = await Promise.all(
        guests.map(async (g: ActiveGuestRow) => {
          let vehicle = null;

          try {
            vehicle = await getVehicleByGuest(String(g.guest_id));
          } catch (err) {
            console.warn("Vehicle fetch failed for guest", g.guest_id);
          }

          return {
            guest: g,
            driver: await getActiveDriverByGuest(String(g.guest_id)),
            vehicle
          };
        })
      );

      setRows(rows);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadGuests();
  }, []);

  /* =======================
     DRIVER ACTIONS
     ======================= */

  async function openAssignDriver(guestId: string) {
    const list = await getAssignableDrivers();
    setDrivers(list);
    setDriverForm({
      guest_id: String(guestId),
      driver_id: "",
      pickup_location: "",
      drop_location: "",
      trip_date: "",
      start_time: "",
      end_time: "",
      trip_status: "Scheduled"
    });
    setDriverModalOpen(true);
  }

  async function submitAssignDriver() {
  if (!driverForm.driver_id) {
    alert("Please select a driver first!");
    return;
  }

  if (!driverForm.trip_date || !driverForm.start_time) {
    alert("Trip date and start time are required");
    return;
  }

  await assignDriverToGuest({
    guest_id: driverForm.guest_id,
    driver_id: driverForm.driver_id,
    pickup_location: driverForm.pickup_location,
    drop_location: driverForm.drop_location,
    trip_date: driverForm.trip_date,
    start_time: driverForm.start_time,
    end_time: driverForm.end_time,
    trip_status: driverForm.trip_status,
  });
  let driver = null;
  try {
    driver = await getActiveDriverByGuest(String(driverForm.guest_id));
  } catch {
    driver = null;
  }

  setDriverModalOpen(false);
  await loadGuests();
}


  /* =======================
     VEHICLE ACTIONS
     ======================= */

  async function openAssignVehicle(guestId: string) {
    const list = await getAssignableVehicles();
    setVehicles(list);
    setVehicleForm({
      guest_id: String(guestId),
      vehicle_no: "",
      location: ""
    });
    setVehicleModalOpen(true);
  }

  async function submitAssignVehicle() {
    await assignVehicleToGuest(vehicleForm);
    setVehicleModalOpen(false);
    await loadGuests();
  }

  /* =======================
     RENDER
     ======================= */

  return (
    <div className="guest-transport space-y-6">
      <div>
        <h2 className="text-[#00247D]">Guest Transport Management</h2>
        <p className="text-sm text-gray-600">
          Assign drivers and vehicles to checked-in guests
        </p>
      </div>

      {loading && <p>Loading...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map(({ guest, driver, vehicle }) => (
          <div key={guest.guest_id} className="transport-card">
            <div className="flex justify-between mb-2">
              <div>
                <p className="font-bold">{guest.guest_name ?? "-" } | {guest.designation_name ?? "-"}</p>
                <p className="subText">
                  Guest Name in Local Language: {guest.guest_name_local_language ?? "-"}
                </p>
                <p className="subText">
                  Guest Contact: {guest.guest_mobile ?? "-"}
                </p>
                <p className="subText">
                  Guest Check In: {guest.entry_date ?? "-"} | {guest.entry_time ?? "-"}
                </p>
                <p className="subText">
                  Guest Check Out: {guest.exit_date ?? "-"} | {guest.exit_time ?? "-"}
                </p>
                <p className="subText">
                  Room: {guest.room_id ?? "-"} | {guest.inout_status ?? "Unknown"}
                </p>
              </div>
            </div>

            {/* DRIVER */}
            <div className="section">
              <h4><UserCheck size={16} /> Driver</h4>

              {driver ? (
                <>
                  <p>{driver.driver_name} </p>
                  <p>{driver.driver_contact}</p>
                  <p>{driver.trip_date}</p>
                  <p>{driver.start_time ?? "-"} | {driver.end_time}</p>
                  <p>{driver.pickup_location ?? "-"} | {driver.drop_location}</p>
                  <p>{driver.trip_status}</p>
                  <button
                    className="dangerBtn"
                    onClick={async () => {
                      await unassignDriver(driver.guest_driver_id);
                      await loadGuests();
                    }}
                  >
                    Unassign Driver
                  </button>
                </>
              ) : (
                <button
                  className="primaryBtn"
                  onClick={() => openAssignDriver(String(guest.guest_id))}
                >
                  Assign Driver
                </button>
              )}
            </div>

            {/* VEHICLE */}
            <div className="section">
              <h4><Car size={16} /> Vehicle</h4>

              {vehicle ? (
                <>
                  <p>{vehicle.vehicle_no} — {vehicle.vehicle_name}</p>
                  <p>{vehicle.model}</p>
                  <p>{vehicle.assigned_at ?? "-"} | {vehicle.released_at}</p>
                  <p>{vehicle.location}</p>
                  <button
                    className="dangerBtn"
                    onClick={async () => {
                      await unassignVehicle(vehicle.guest_vehicle_id);
                      await loadGuests();
                    }}
                  >
                    Unassign Vehicle
                  </button>
                </>
              ) : (
                <button
                  className="primaryBtn"
                  onClick={() => openAssignVehicle(String(guest.guest_id))}
                >
                  Assign Vehicle
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ASSIGN DRIVER MODAL */}
      {driverModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Assign Driver</h2>
              <button onClick={() => setDriverModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
              <select
                className="nicInput"
                value={driverForm.driver_id}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, driver_id: e.target.value })
                }
              >
                <option value="">Select Driver</option>
                {drivers.map((d) => (
                  <option key={d.driver_id} value={d.driver_id}>
                    {d.driver_name}
                  </option>
                ))}
              </select>

              <input
                className="nicInput"
                placeholder="Pickup Location"
                value={driverForm.pickup_location}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, pickup_location: e.target.value })
                }
              />

              <input
                className="nicInput"
                placeholder="Drop Location"
                value={driverForm.drop_location}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, pickup_location: e.target.value })
                }
              />

              <input
                type="date"
                className="nicInput"
                value={driverForm.trip_date}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, trip_date: e.target.value })
                }
              />

              <input
                type="time"
                className="nicInput"
                value={driverForm.start_time}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, start_time: e.target.value })
                }
              />
              <input
                type="time"
                className="nicInput"
                value={driverForm.end_time}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, end_time: e.target.value })
                }
              />
            </div>

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setDriverModalOpen(false)}>
                Cancel
              </button>
              <button className="saveBtn" onClick={submitAssignDriver}>
                Assign Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN VEHICLE MODAL */}
      {vehicleModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Assign Vehicle</h2>
              <button onClick={() => setVehicleModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
              <select
                className="nicInput"
                value={vehicleForm.vehicle_no}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, vehicle_no: e.target.value })
                }
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.vehicle_no} value={v.vehicle_no}>
                    {v.vehicle_name}
                  </option>
                ))}
              </select>

              <input
                className="nicInput"
                placeholder="Location"
                value={vehicleForm.location}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, location: e.target.value })
                }
              />
              <input
                className="nicInput"
                placeholder="Assigned At"
                value={vehicleForm.assigned_at}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, assigned_at: e.target.value })
                }
              />
              <input
                className="nicInput"
                placeholder="Released At"
                value={vehicleForm.released_at}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, released_at: e.target.value })
                }
              />
            </div>

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setVehicleModalOpen(false)}>
                Cancel
              </button>
              <button className="saveBtn" onClick={submitAssignVehicle}>
                Assign Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestTransportManagement;
