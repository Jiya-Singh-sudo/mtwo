// src/components/modules/DriverManagement/Page.tsx
import { User, Phone, Shield, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getDriverDashboard,
  createDriver,
  updateDriver,
  getAssignableGuestVehicles,
  assignDriverToGuestVehicle,
} from "@/api/driver.api";

import type { DriverDashboardRow } from "../../../types/drivers";

import "./DriverManagement.css";

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<DriverDashboardRow[]>([]);
  const [loading, setLoading] = useState(false);

  const available = drivers.filter((d) => d.duty_status === "AVAILABLE").length;
  const onDuty = drivers.filter((d) => d.duty_status === "ON_DUTY").length;

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {
    try {
      setLoading(true);
      const data = await getDriverDashboard();
      setDrivers(data);
    } catch (err) {
      console.error("Failed to load drivers", err);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- ADD / EDIT MODAL ---------------- */
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "",
    license: "",
    status: "AVAILABLE",
  });

  /* ---------------- VIEW MODAL ---------------- */
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  /* ---------------- ASSIGN VEHICLE MODAL ---------------- */
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] =
    useState<DriverDashboardRow | null>(null);
  const [assignableGuestVehicles, setAssignableGuestVehicles] = useState<any[]>(
    []
  );
  const [assignForm, setAssignForm] = useState({
    guest_vehicle_id: "",
  });

  /* ---------------- SAVE DRIVER ---------------- */
  async function saveDriver() {
    if (!driverForm.name.trim() || !driverForm.phone.trim()) return;

    try {
      if (mode === "add") {
        await createDriver({
          driver_name: driverForm.name,
          driver_contact: driverForm.phone,
          driver_license: driverForm.license || undefined,
        });
      }

      if (mode === "edit" && editingId) {
        await updateDriver(editingId, {
          driver_name: driverForm.name,
          driver_contact: driverForm.phone,
          driver_license: driverForm.license || undefined,
        });
      }

      setIsDriverModalOpen(false);
      await loadDrivers();
    } catch (err) {
      console.error("Failed to save driver", err);
    }
  }

  return (
    <>
      {/* ================= PAGE ================= */}
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#00247D]">Driver Management Dashboard</h2>
            <p className="text-sm text-gray-600">
              चालक प्रबंधन – Manage drivers and assignments
            </p>
          </div>
          <button
            className="nicPrimaryBtn"
            onClick={() => {
              setMode("add");
              setEditingId(null);
              setDriverForm({
                name: "",
                phone: "",
                license: "",
                status: "AVAILABLE",
              });
              setIsDriverModalOpen(true);
            }}
          >
            Add New Driver
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="statCard green">
                <p>Available Drivers</p>
                <h3>{available}</h3>
              </div>
              <div className="statCard blue">
                <p>On Duty</p>
                <h3>{onDuty}</h3>
              </div>
              <div className="statCard gray">
                <p>Total Drivers</p>
                <h3>{drivers.length}</h3>
              </div>
            </div>

            {/* DRIVER LIST */}
            <div className="bg-white border rounded-sm">
              <div className="border-b px-6 py-4">
                <h3 className="text-[#00247D]">Driver List</h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {drivers.map((driver) => (
                  <div key={driver.driver_id} className="vehicleCard">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div
                          className={`iconBox ${
                            driver.duty_status === "AVAILABLE"
                              ? "Available"
                              : "OnDuty"
                          }`}
                        >
                          <User />
                        </div>
                        <div>
                          <p>{driver.driver_name}</p>
                          <p className="subText">{driver.driver_id}</p>
                        </div>
                      </div>
                      <span
                        className={`statusPill ${
                          driver.duty_status === "AVAILABLE"
                            ? "Available"
                            : "OnDuty"
                        }`}
                      >
                        {driver.duty_status}
                      </span>
                    </div>

                    <div className="details">
                      <div>
                        <Shield /> {driver.driver_license || "—"}
                      </div>
                      <div>
                        <Phone /> {driver.driver_contact}
                      </div>
                      {driver.vehicle_no && (
                        <div>Vehicle: {driver.vehicle_no}</div>
                      )}
                      {driver.guest_name && (
                        <div>Assigned: {driver.guest_name}</div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        className="viewBtn"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setIsViewModalOpen(true);
                        }}
                      >
                        View
                      </button>

                      <button
                        className="editBtn"
                        onClick={() => {
                          setMode("edit");
                          setEditingId(driver.driver_id);
                          setDriverForm({
                            name: driver.driver_name,
                            phone: driver.driver_contact,
                            license: driver.driver_license ?? "",
                            status: driver.duty_status,
                          });
                          setIsDriverModalOpen(true);
                        }}
                      >
                        Edit Details
                      </button>

                      <button
                        className="assignBtn"
                        onClick={async () => {
                          setSelectedDriver(driver);
                          setAssignForm({ guest_vehicle_id: "" });
                          const data =
                            await getAssignableGuestVehicles();
                          setAssignableGuestVehicles(data);
                          setIsAssignModalOpen(true);
                        }}
                      >
                        Assign Vehicle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isDriverModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>
                {mode === "add" ? "Add New Driver" : "Edit Driver Details"}
              </h2>
              <button onClick={() => setIsDriverModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
              <input
                className="nicInput"
                placeholder="Full Name"
                value={driverForm.name}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, name: e.target.value })
                }
              />
              <input
                className="nicInput"
                placeholder="Contact Number"
                value={driverForm.phone}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, phone: e.target.value })
                }
              />
              <input
                className="nicInput"
                placeholder="License Number"
                value={driverForm.license}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, license: e.target.value })
                }
              />

              {/* Status is backend-controlled (read-only) */}
              <select className="nicInput" value={driverForm.status} disabled>
                <option value="AVAILABLE">Available</option>
                <option value="ON_DUTY">On Duty</option>
              </select>
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setIsDriverModalOpen(false)}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={saveDriver}>
                {mode === "add" ? "Add Driver" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW DRIVER MODAL ================= */}
      {isViewModalOpen && selectedDriver && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Driver Details</h2>
              <button onClick={() => setIsViewModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm space-y-3">
              <div>
                <strong>Name:</strong>
                <p>{selectedDriver.driver_name}</p>
              </div>
              <div>
                <strong>Driver ID:</strong>
                <p>{selectedDriver.driver_id}</p>
              </div>
              <div>
                <strong>Contact:</strong>
                <p>{selectedDriver.driver_contact}</p>
              </div>
              <div>
                <strong>License:</strong>
                <p>{selectedDriver.driver_license || "—"}</p>
              </div>
              <div>
                <strong>Status:</strong>
                <p>{selectedDriver.duty_status}</p>
              </div>
              {selectedDriver.vehicle_no && (
                <div>
                  <strong>Vehicle No:</strong>
                  <p>{selectedDriver.vehicle_no}</p>
                </div>
              )}
              {selectedDriver.guest_name && (
                <div>
                  <strong>Assigned Guest:</strong>
                  <p>{selectedDriver.guest_name}</p>
                </div>
              )}
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ASSIGN VEHICLE MODAL ================= */}
      {isAssignModalOpen && selectedDriver && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Assign Vehicle</h2>
              <button onClick={() => setIsAssignModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
              <select
                className="nicInput"
                value={assignForm.guest_vehicle_id}
                onChange={(e) =>
                  setAssignForm({ guest_vehicle_id: e.target.value })
                }
              >
                <option value="">Select Guest</option>
                {assignableGuestVehicles.map((gv) => (
                  <option
                    key={gv.guest_vehicle_id}
                    value={gv.guest_vehicle_id}
                  >
                    {gv.vehicle_no} — {gv.guest_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="saveBtn"
                onClick={async () => {
                  if (!assignForm.guest_vehicle_id) return;

                  await assignDriverToGuestVehicle({
                    guest_vehicle_id: assignForm.guest_vehicle_id,
                    driver_id: selectedDriver.driver_id,
                  });

                  setIsAssignModalOpen(false);
                  await loadDrivers();
                }}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
