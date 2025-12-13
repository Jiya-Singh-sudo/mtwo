// src/components/modules/DriverManagement/Page.tsx
import { useState } from "react";
import { User, Phone, Shield, Clock, X } from "lucide-react";
import "./DriverManagement.css";

interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  shift: string;
  status: "Available" | "On Duty";
  vehicle: string | null;
  assignedTo: string | null;
  experience: string;
  rating: string;
}

export default function DriverManagement() {
  /* ---------------- DRIVERS ---------------- */
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "D001",
      name: "Ram Singh",
      phone: "+91-98765-43210",
      license: "DL-1420110012345",
      shift: "Day Shift",
      status: "On Duty",
      vehicle: "DL-01-AB-1234",
      assignedTo: "Shri Rajesh Kumar",
      experience: "15 years",
      rating: "4.8/5",
    },
    {
      id: "D002",
      name: "Mohan Kumar",
      phone: "+91-98765-12345",
      license: "DL-1420110054321",
      shift: "Day Shift",
      status: "On Duty",
      vehicle: "DL-01-CD-5678",
      assignedTo: "Shri Amit Verma",
      experience: "12 years",
      rating: "4.6/5",
    },
  ]);

  /* ---------------- ADD / EDIT MODAL ---------------- */
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "",
    license: "",
    status: "Available",
  });

  /* ---------------- ASSIGN VEHICLE MODAL ---------------- */
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [assignForm, setAssignForm] = useState({
    vehicle: "",
    assignedTo: "",
  });

  /* ---------------- SAVE DRIVER ---------------- */
  function saveDriver() {
    if (!driverForm.name || !driverForm.phone || !driverForm.license) return;

    if (mode === "add") {
      setDrivers((prev) => [
        ...prev,
        {
          id: `D00${prev.length + 1}`,
          name: driverForm.name,
          phone: driverForm.phone,
          license: driverForm.license,
          status: driverForm.status as "Available" | "On Duty",
          shift: "Day Shift",
          vehicle: null,
          assignedTo: null,
          experience: "0 years",
          rating: "N/A",
        },
      ]);
    }

    if (mode === "edit" && editingId) {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                name: driverForm.name,
                phone: driverForm.phone,
                license: driverForm.license,
                status: driverForm.status as "Available" | "On Duty",
              }
            : d
        )
      );
    }

    setIsDriverModalOpen(false);
  }

  /* ---------------- STATS ---------------- */
  const available = drivers.filter((d) => d.status === "Available").length;
  const onDuty = drivers.filter((d) => d.status === "On Duty").length;

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
              <div key={driver.id} className="vehicleCard">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <div
                      className={`iconBox ${
                        driver.status === "Available"
                          ? "Available"
                          : "OnDuty"
                      }`}
                    >
                      <User />
                    </div>
                    <div>
                      <p>{driver.name}</p>
                      <p className="subText">{driver.id}</p>
                    </div>
                  </div>
                  <span
                    className={`statusPill ${
                      driver.status === "Available"
                        ? "Available"
                        : "OnDuty"
                    }`}
                  >
                    {driver.status}
                  </span>
                </div>

                <div className="details">
                  <div>
                    <Shield /> {driver.license}
                  </div>
                  <div>
                    <Phone /> {driver.phone}
                  </div>
                  <div>
                    <Clock /> {driver.shift}
                  </div>
                  {driver.vehicle && <div>Vehicle: {driver.vehicle}</div>}
                  {driver.assignedTo && (
                    <div>Assigned: {driver.assignedTo}</div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    className="editBtn"
                    onClick={() => {
                      setMode("edit");
                      setEditingId(driver.id);
                      setDriverForm({
                        name: driver.name,
                        phone: driver.phone,
                        license: driver.license,
                        status: driver.status,
                      });
                      setIsDriverModalOpen(true);
                    }}
                  >
                    Edit Details
                  </button>

                  <button
                    className="assignBtn"
                    onClick={() => {
                      setSelectedDriver(driver);
                      setAssignForm({
                        vehicle: driver.vehicle || "",
                        assignedTo: driver.assignedTo || "",
                      });
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

      {/* ================= ADD / EDIT MODAL ================= */}
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
              <input
                className="nicInput"
                placeholder="Vehicle Number"
                value={assignForm.vehicle}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, vehicle: e.target.value })
                }
              />
              <input
                className="nicInput"
                placeholder="Assigned To"
                value={assignForm.assignedTo}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, assignedTo: e.target.value })
                }
              />
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
                onClick={() => {
                  setDrivers((prev) =>
                    prev.map((d) =>
                      d.id === selectedDriver.id
                        ? {
                            ...d,
                            vehicle: assignForm.vehicle,
                            assignedTo: assignForm.assignedTo,
                            status: "On Duty",
                          }
                        : d
                    )
                  );
                  setIsAssignModalOpen(false);
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
