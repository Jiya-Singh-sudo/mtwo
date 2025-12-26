// src/components/modules/DriverManagement/Page.tsx
import { useEffect, useState } from "react";
import { User, Phone, Shield, X } from "lucide-react";
import "./DriverManagement.css";

import {
  fetchDrivers,
  createDriver,
  updateDriver,
  assignDriverToGuestVehicle,
  getAssignableGuestVehicles,
} from "../../../api/driver.api";

import { DriverDashboardRow } from "../../../types/drivers";
type AssignableGuestVehicle = Awaited<
  ReturnType<typeof getAssignableGuestVehicles>
>[number];

function DriverManagement() {
  /* ---------------- DRIVERS ---------------- */
  const [drivers, setDrivers] = useState<DriverDashboardRow[]>([]);

  /* ---------------- ADD / EDIT MODAL ---------------- */
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeVehicles, setActiveVehicles] = useState<AssignableGuestVehicle[]>([]);


  const [driverForm, setDriverForm] = useState({
    name: "",
    driver_name_local: "",
    phone: "",
    driver_alternate_mobile: "",
    license: "",
    address: "",
    status: "Available",
  });

  /* ---------------- ASSIGN VEHICLE MODAL ---------------- */
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] =
    useState<DriverDashboardRow | null>(null);

  const [assignForm, setAssignForm] = useState({
    vehicle: "",
  });

  /* ---------------- LOAD DRIVERS ---------------- */
  async function loadDrivers() {
    const data = await fetchDrivers();
    setDrivers(data); // already DriverDashboardRow[]
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  /* ---------------- SAVE DRIVER ---------------- */
  async function saveDriver() {
    if (!driverForm.name || !driverForm.phone || !driverForm.license) return;

    if (mode === "add") {
      await createDriver({
        driver_name: driverForm.name,
        driver_name_local: driverForm.driver_name_local,
        driver_contact: driverForm.phone,
        driver_alternate_mobile: driverForm.driver_alternate_mobile,
        driver_license: driverForm.license,
        address: driverForm.address,

      });
    }

    if (mode === "edit" && editingId) {
      await updateDriver(editingId, {
        driver_name: driverForm.name,
        driver_name_local: driverForm.driver_name_local,
        driver_contact: driverForm.phone,
        driver_alternate_mobile: driverForm.driver_alternate_mobile,
        driver_license: driverForm.license,
        address: driverForm.address,
        is_active: driverForm.status === "Available",
      });
    }

    setIsDriverModalOpen(false);
    await loadDrivers();
  }

  /* ---------------- STATS ---------------- */
  const available = drivers.filter(
    (d) => d.duty_status === "Available"
  ).length;

  const onDuty = drivers.filter(
    (d) => d.duty_status === "Unavailable"
  ).length;

  return (
    <>
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
                driver_name_local: "",
                phone: "",
                driver_alternate_mobile: "",
                license: "",
                address: "",
                status: "Available",
              });
              setIsDriverModalOpen(true);
            }}
          >
            Add New Driver
          </button>
        </div>

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
                      className={`iconBox ${driver.duty_status === "Available"
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
                    className={`statusPill ${driver.duty_status === "Available"
                      ? "Available"
                      : "OnDuty"
                      }`}
                  >
                    {driver.duty_status}
                  </span>
                </div>

                <div className="details">
                  <div>
                    <Shield /> {driver.driver_license}
                  </div>
                  <div>
                    <Phone /> {driver.driver_contact}
                  </div>
                  {driver.vehicle_no && <div>Vehicle: {driver.vehicle_no}</div>}
                  {driver.guest_name && (
                    <div>Assigned: {driver.guest_name}</div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    className="editBtn"
                    onClick={() => {
                      setMode("edit");
                      setEditingId(driver.driver_id);
                      setDriverForm({
                        name: driver.driver_name || "",
                        driver_name_local: "",
                        phone: driver.driver_contact || "",
                        driver_alternate_mobile: "",
                        license: driver.driver_license || "",
                        address: "",
                        status: driver.duty_status || "Available",
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
                      const vehicles = await getAssignableGuestVehicles();
                      setActiveVehicles(vehicles);
                      setAssignForm({ vehicle: "" });
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
      </div>

      {/* ADD / EDIT MODAL */}
      {isDriverModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>{mode === "add" ? "Add New Driver" : "Edit Driver Details"}</h2>
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
              <select
                className="nicInput"
                value={driverForm.status}
                onChange={(e) =>
                  setDriverForm({ ...driverForm, status: e.target.value })
                }
              >
                <option>Available</option>
                <option>On Duty</option>
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

      {/* ASSIGN VEHICLE MODAL */}
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
                value={assignForm.vehicle}
                onChange={(e) =>
                  setAssignForm({ vehicle: e.target.value })
                }
              >
                <option value="">Select Vehicle</option>
                {activeVehicles.map((v) => (
                  <option key={v.guest_vehicle_id} value={v.guest_vehicle_id}>
                    {v.vehicle_no} — {v.guest_name}
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
                  await assignDriverToGuestVehicle({
                    driver_id: selectedDriver.driver_id,
                    guest_vehicle_id: assignForm.vehicle,
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

export default DriverManagement;
