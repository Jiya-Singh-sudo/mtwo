import { useEffect, useState } from "react";
import { Car, UserCheck, X } from "lucide-react";
import "./GuestTransportManagement.css";
import { Input } from "@/components/ui/input";
import GuestTransportCardSkeleton from "@/components/skeletons/GuestTransportCardSkeleton";
import {
  formatISTDateTime,
  formatISTDate,
  toDateTimeLocal,
  formatISTTime
} from "../../../utils/dateTime";
import TimePicker12h from "@/components/common/TimePicker12h"
import {
  // getActiveGuests,
  // getActiveDriverByGuest,
  // getVehicleByGuest,
  assignDriverToGuest,
  assignVehicleToGuest,
  unassignDriver,
  unassignVehicle,
  getAssignableDrivers,
  getAssignableVehicles,
  updateDriverTrip,
  updateVehicleAssignment,
  getGuestTransportTable
} from "../../../api/guestTransport.api";
import { useTableQuery } from "@/hooks/useTableQuery";
import { GuestTransportRow } from "../../../types/guestTransport";
import { AssignGuestDriverPayload } from "../../../types/guestDriver";
import { AssignGuestVehiclePayload } from "../../../types/guestVehicle";
import { AssignableDriver } from "../../../types/drivers";
import { AssignableVehicle } from "../../../types/vehicles";
// import { ActiveGuestRow } from "../../../types/guests";

function GuestTransportManagement() {
  /* =======================
     PAGE STATE
     ======================= */
  // const [rows, setRows] = useState<GuestTransportRow[]>([]);
  // const [loading, setLoading] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<
    "ALL" | "DRIVER_ASSIGNED" | "VEHICLE_ASSIGNED" | "UNASSIGNED"
  >("ALL");


  const GuestTable = useTableQuery({
    sortBy: "entry_date",
    sortOrder: "desc",
    limit: 6, // cards per page
  });
  const [rows, setRows] = useState<GuestTransportRow[]>([]);
  const totalPages = Math.max(
    1,
    Math.ceil(GuestTable.total / GuestTable.query.limit)
  );

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
    // Pickup (planned)
    trip_date: "",
    start_time: "",
    end_time: "",
    // Drop (actual)
    drop_date: "",
    drop_time: "",
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
  // async function loadGuests() {
  //   setLoading(true);
  //   try {
  //     // 1. Pass the required pagination parameters (e.g., page 1, limit 100)
  //     // 2. Destructure 'data' from the response
  //     const response = await getActiveGuests({ page: 1, limit: 100 });
  //     const guestList = response.data || [];

  //     const rows = await Promise.all(
  //       guestList.map(async (g: ActiveGuestRow) => {
  //         let vehicle = null;
  //         try {
  //           vehicle = await getVehicleByGuest(String(g.guest_id));
  //         } catch (err) {
  //           console.warn("Vehicle fetch failed for guest", g.guest_id);
  //         }

  //         return {
  //           guest: g,
  //           driver: await getActiveDriverByGuest(String(g.guest_id)),
  //           vehicle
  //         };
  //       })
  //     );

  //     setRows(rows);
  //   } catch (error) {
  //     console.error("Failed to load guests:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  useEffect(() => {
    async function load() {
      GuestTable.setLoading(true);
      try {
        const res = await getGuestTransportTable(GuestTable.query);
        const adaptedRows: GuestTransportRow[] = res.data.map((guest: any) => ({
          guest,
          driver: null,
          vehicle: null,
        }));
        setRows(adaptedRows);
        GuestTable.setTotal(res.totalCount);
      } finally {
        GuestTable.setLoading(false);
      }
    }
    load();
  }, [GuestTable.query]);

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
      drop_date: "",
      drop_time: "",
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
    GuestTable.setPage(1);
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
    GuestTable.setPage(1);
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
    GuestTable.setPage(1);
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
    GuestTable.setPage(1);
  }

  /* =======================
     RENDER
     ======================= */

  return (
    <>
      <div className="guest-transport space-y-6">
        <div>
          <h2 className="text-[#00247D]">Guest Transport Management</h2>
          <p className="text-sm text-gray-600">
            Assign drivers and vehicles to checked-in guests
          </p>
        </div>

        {/* {GuestTable.loading && <p>Loading...</p>} */}

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
        <div className="flex flex-wrap gap-4 items-end">
          <Input
            className="w-64"
            placeholder="Search guest name / mobile / ID…"
            value={GuestTable.searchInput}
            onChange={(e: any) => GuestTable.setSearchInput(e.target.value)}
          />
          <div className="flex flex-wrap gap-4 items-end">
            {/* Status */}
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <select
                className="nicInput"
                value={GuestTable.query.status}
                onChange={(e) => GuestTable.setStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Entered">Entered</option>
                <option value="Inside">Inside</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Exited">Exited</option>
              </select>
            </div>

            {/* Entry Date From */}
            <div>
              <label className="text-sm text-gray-600">From</label>
              <input
                type="date"
                className="nicInput"
                value={GuestTable.query.entryDateFrom}
                onChange={(e) => GuestTable.setEntryDateFrom(e.target.value)}
              />
            </div>

            {/* Entry Date To */}
            <div>
              <label className="text-sm text-gray-600">To</label>
              <input
                type="date"
                className="nicInput"
                value={GuestTable.query.entryDateTo}
                onChange={(e) => GuestTable.setEntryDateTo(e.target.value)}
              />
            </div>

            {/* Reset */}
            <button
              className="secondaryBtn"
              onClick={() => {
                GuestTable.setStatus("All");
                GuestTable.setEntryDateFrom("");
                GuestTable.setEntryDateTo("");
                GuestTable.setPage(1);
              }}
            >
              Reset
            </button>
          </div>
          <div>
            <label className="text-sm text-gray-600">Assignment</label>
            <select
              className="nicInput"
              value={assignmentFilter}
              onChange={(e) =>
                setAssignmentFilter(e.target.value as any)
              }
            >
              <option value="ALL">All</option>
              <option value="DRIVER_ASSIGNED">Driver Assigned</option>
              <option value="VEHICLE_ASSIGNED">Vehicle Assigned</option>
              <option value="UNASSIGNED">Unassigned</option>
            </select>
          </div>
        </div>
        
          {/* 2️⃣ Empty state */}
          {/* {!GuestTable.loading && rows.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No guests found</p>
              <p className="text-sm mt-1">
                Try adjusting search, filters, or date range
              </p>
            </div>
          )} */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 1️⃣ Loading */}
          {GuestTable.loading &&
            Array.from({ length: GuestTable.query.limit }).map((_, i) => (
              <GuestTransportCardSkeleton key={i} />
            ))
          }

            {/* Empty */}
          {!GuestTable.loading && rows.length === 0 && (
            <div className="md:col-span-2 text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No guests found</p>
              <p className="text-sm mt-1">
                Try adjusting search, filters, or date range
              </p>
            </div>
          )}

          {/* 3️⃣ Cards */}
          {!GuestTable.loading &&
            rows
              .filter((r) => {
                if (assignmentFilter === "DRIVER_ASSIGNED") return !!r.driver;
                if (assignmentFilter === "VEHICLE_ASSIGNED") return !!r.vehicle;
                if (assignmentFilter === "UNASSIGNED") return !r.driver && !r.vehicle;
                return true;
              })
              .map(({ guest, driver, vehicle }) => {
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
                                drop_date: driver.drop_date,
                                drop_time: driver.drop_time,
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
                              GuestTable.setPage(1);
                            }}
                          >
                            Unassign Driver
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        className="primaryBtn mt-2"
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
                              GuestTable.setPage(1); // Reset to page 1
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
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRows.map(card)}
      </div> */}

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Page {GuestTable.query.page} of{totalPages}
          </div>

          <div className="flex gap-2">
            <button
              className="secondaryBtn"
              disabled={GuestTable.query.page === 1}
              onClick={() => GuestTable.setPage(GuestTable.query.page - 1)}
            >
              Previous
            </button>

            <button
              className="secondaryBtn"
              disabled={
                GuestTable.query.page >= totalPages
              }
              onClick={() => GuestTable.setPage(GuestTable.query.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
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

              <h4>Pickup Schedule</h4>

              <input type="date" className="nicInput" />

              <TimePicker12h
                label="From Time"
                onChange={(v) => setDriverForm({ ...driverForm, start_time: v })}
              />

              <TimePicker12h
                label="To Time"
                onChange={(v) => setDriverForm({ ...driverForm, end_time: v })}
              />

              <hr />

              <h4>Drop Details</h4>

              <input
                type="date"
                className="nicInput"
                value={driverForm.drop_date}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, drop_date: e.target.value })
                }
              />

              <TimePicker12h
                label="Drop Time"
                onChange={(v) =>
                  setDriverForm({ ...driverForm, drop_time: v })
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

    </>
  );
}

export default GuestTransportManagement;
