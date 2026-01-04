import { useEffect, useState } from "react";
import { Car, UserCheck, X } from "lucide-react";
import "./GuestTransportManagement.css";
import {
  formatISTDateTime,
  formatISTDate,
  toDateTimeLocal,
  formatISTTime
} from "../../../utils/dateTime";
import {
  getActiveGuests,
  getActiveDriverByGuest,
  getVehicleByGuest,
  assignDriverToGuest,
  assignVehicleToGuest,
  unassignDriver,
  unassignVehicle,
  getAssignableDrivers,
  getAssignableVehicles,
  updateDriverTrip,
  updateVehicleAssignment
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
     EDIT DRIVER MODAL
     ======================= */

  const [editDriverModalOpen, setEditDriverModalOpen] = useState(false);
  const [editingGuestDriverId, setEditingGuestDriverId] = useState<string | null>(null);

  /* =======================
     EDIT VEHICLE MODAL
     ======================= */
  const [editVehicleModalOpen, setEditVehicleModalOpen] = useState(false);
  const [editingGuestVehicleId, setEditingGuestVehicleId] = useState<string | null>(null);


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
    if (driverForm.end_time && driverForm.end_time < driverForm.start_time) {
      alert("End time cannot be earlier than start time");
      return;
    }

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
     EDIT DRIVER ACTIONS
     ======================= */

  async function submitEditDriver() {
    if (!editingGuestDriverId) return;

    await updateDriverTrip(editingGuestDriverId, {
      pickup_location: driverForm.pickup_location || undefined,
      drop_location: driverForm.drop_location || undefined,
      trip_date: driverForm.trip_date || undefined,
      start_time: driverForm.start_time || undefined,
      end_time: driverForm.end_time || undefined,
      trip_status: driverForm.trip_status,
    });

    setEditDriverModalOpen(false);
    setEditingGuestDriverId(null);
    await loadGuests();
  }

  /* =======================
   EDIT VEHICLE ACTIONS
   ======================= */
  async function submitEditVehicle() {
    if (!editingGuestVehicleId) return;

    await updateVehicleAssignment(editingGuestVehicleId, {
      location: vehicleForm.location,
    });

    setEditVehicleModalOpen(false);
    setEditingGuestVehicleId(null);
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
        {rows.map(({ guest, driver, vehicle }) => {
          if (!guest) return null;
          return (
            <div key={guest.guest_id} className="transportCard">

              {/* ================= GUEST HEADER ================= */}
              <div className="guestHeader">
                <div>
                  <h3 className="guestName">
                    {guest.guest_name ?? "-"}
                    <span className="guestLocal">
                      {guest.guest_name_local_language
                        ? ` | ${guest.guest_name_local_language}`
                        : ""}
                    </span>
                  </h3>

                  <div className="guestMeta">
                    <span><strong>Contact:</strong> {guest.guest_mobile ?? "-"}</span>
                    <span><strong>Room:</strong> {guest.room_id ?? "-"}</span>
                    <span><strong>Status:</strong> {guest.inout_status ?? "-"}</span>
                  </div>

                  <div className="guestMeta">
                    <span>
                      <strong>Stay:</strong>{" "}
                      {formatISTDateTime(guest.entry_date)} →{" "}
                      {formatISTDateTime(guest.exit_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= DRIVER ================= */}
              <div className="infoSection">
                <h4><UserCheck size={16} /> Driver</h4>

                {driver ? (
                  <>
                    <div className="infoGrid">
                      <div><strong>Name:</strong> {driver.driver_name}</div>
                      <div><strong>Contact:</strong> {driver.driver_contact}</div>
                      <div><strong>Pickup:</strong> {driver.pickup_location ?? "-"}</div>
                      <div><strong>Drop:</strong> {driver.drop_location ?? "-"}</div>
                      <div>  <strong>Date:</strong> {formatISTDate(driver.trip_date)}</div>
                      <div>
                        <strong>Time:</strong>{" "}
                        {driver.start_time
                          ? formatISTTime(`${driver.trip_date}T${driver.start_time}`)
                          : "-"}
                        {" → "}
                        {driver.end_time
                          ? formatISTTime(`${driver.trip_date}T${driver.end_time}`)
                          : "-"}

                      </div>
                      <div><strong>Status:</strong> {driver.trip_status}</div>
                    </div>

                    <div className="actionRow">
                      <button
                        className="secondaryBtn"
                        onClick={() => {
                          setEditingGuestDriverId(driver.guest_driver_id);
                          setDriverForm({
                            guest_id: String(guest.guest_id),
                            driver_id: driver.driver_id,
                            pickup_location: driver.pickup_location ?? "",
                            drop_location: driver.drop_location ?? "",
                            trip_date: driver.trip_date,
                            start_time: driver.start_time,
                            end_time: driver.end_time ?? "",
                            trip_status: driver.trip_status,
                          });
                          setEditDriverModalOpen(true);
                        }}
                      >
                        Edit Driver Trip
                      </button>

                      <button
                        className="dangerBtn"
                        onClick={async () => {
                          await unassignDriver(driver.guest_driver_id);
                          await loadGuests();
                        }}
                      >
                        Unassign Driver
                      </button>
                    </div>
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

              {/* ================= VEHICLE ================= */}
              <div className="infoSection">
                <h4><Car size={16} /> Vehicle</h4>

                {vehicle ? (
                  <>
                    <div className="infoGrid">
                      <div>
                        <strong>Vehicle:</strong>{" "}
                        {vehicle.vehicle_name} ({vehicle.vehicle_no})
                      </div>
                      <div><strong>Model:</strong> {vehicle.model ?? "-"}</div>
                      <div><strong>Color:</strong> {vehicle.color ?? "-"}</div>
                      <div><strong>Location:</strong> {vehicle.location ?? "-"}</div>
                      <div>
                        <strong>From:</strong> {formatISTDateTime(vehicle.assigned_at)}
                      </div>
                      <div>
                        <strong>To:</strong>{" "}
                        {vehicle.released_at
                          ? formatISTDateTime(vehicle.released_at)
                          : "Ongoing"}
                      </div>
                    </div>

                    <div className="actionRow">
                      <button
                        className="secondaryBtn"
                        onClick={() => {
                          setEditingGuestVehicleId(vehicle.guest_vehicle_id);
                          setVehicleForm({
                            guest_id: String(guest.guest_id),
                            vehicle_no: vehicle.vehicle_no,
                            location: vehicle.location ?? "",
                            assigned_at: vehicle.assigned_at,
                            released_at: vehicle.released_at ?? undefined,
                          });
                          setEditVehicleModalOpen(true);
                        }}
                      >
                        Edit Vehicle Assignment
                      </button>

                      <button
                        className="dangerBtn"
                        onClick={async () => {
                          await unassignVehicle(vehicle.guest_vehicle_id);
                          await loadGuests();
                        }}
                      >
                        Unassign Vehicle
                      </button>
                    </div>
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
          );
        })}
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
                  setDriverForm({ ...driverForm, drop_location: e.target.value })
                }
              />

              <input
                type="date"
                className="nicInput"
                value={driverForm.trip_date ? driverForm.trip_date.split('T')[0] : ""}
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
                value={driverForm.end_time ?? ""}
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
                type="datetime-local"
                placeholder="Assigned At"
                value={toDateTimeLocal(vehicleForm.assigned_at)}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, assigned_at: e.target.value })
                }
              />
              <input
                className="nicInput"
                type="datetime-local"
                placeholder="Released At"
                value={toDateTimeLocal(vehicleForm.released_at)}
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

      {/* EDIT DRIVER MODAL */}
      {editDriverModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Edit Driver Trip</h2>
              <button onClick={() => setEditDriverModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
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
                  setDriverForm({ ...driverForm, drop_location: e.target.value })
                }
              />

              <input
                type="date"
                className="nicInput"
                value={driverForm.trip_date ? driverForm.trip_date.split('T')[0] : ""}
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
                value={driverForm.end_time ?? ""}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, end_time: e.target.value })
                }
              />
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setEditDriverModalOpen(false)}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={submitEditDriver}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {editVehicleModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Edit Vehicle Assignment</h2>
              <button onClick={() => setEditVehicleModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
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
                type="datetime-local"
                placeholder="Assigned At"
                value={toDateTimeLocal(vehicleForm.assigned_at)}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, assigned_at: e.target.value })
                }
              />
              <input
                className="nicInput"
                type="datetime-local"
                placeholder="Released At"
                value={toDateTimeLocal(vehicleForm.released_at)}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, released_at: e.target.value })
                }
              />
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setEditVehicleModalOpen(false)}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={submitEditVehicle}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default GuestTransportManagement;
