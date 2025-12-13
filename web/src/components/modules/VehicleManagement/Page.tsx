// src/components/modules/VehicleManagement/Page.tsx
import { useState } from "react";
import { Car, User, MapPin, X } from "lucide-react";
import "./VehicleManagement.css";

interface Vehicle {
  id: string;
  number: string;
  type: string;
  status: "Available" | "On Duty" | "In Service";
  driver: string | null;
  assignedTo: string | null;
  location: string;
}

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "V001",
      number: "DL-01-AB-1234",
      type: "Toyota Innova",
      status: "On Duty",
      driver: "Ram Singh",
      assignedTo: "Shri Rajesh Kumar",
      location: "Guest House",
    },
    {
      id: "V002",
      number: "DL-01-CD-5678",
      type: "Honda City",
      status: "On Duty",
      driver: "Mohan Kumar",
      assignedTo: "Shri Amit Verma",
      location: "Ministry",
    },
    {
      id: "V003",
      number: "DL-01-EF-9012",
      type: "Toyota Fortuner",
      status: "Available",
      driver: "Suresh Yadav",
      assignedTo: null,
      location: "Parking",
    },
    {
      id: "V004",
      number: "DL-01-GH-3456",
      type: "Maruti Ertiga",
      status: "In Service",
      driver: null,
      assignedTo: null,
      location: "Service Center",
    },
  ]);

  /* ---------------- MODAL STATE ---------------- */
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    vehicleId: "",
    guestName: "",
    location: "Guest House",
  });

  /* ---------------- ACTIONS ---------------- */
  function submitAssignVehicle() {
    if (!assignForm.vehicleId || !assignForm.guestName.trim()) {
      alert("Vehicle and Guest Name are required");
      return;
    }

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === assignForm.vehicleId
          ? {
              ...v,
              status: "On Duty",
              assignedTo: assignForm.guestName,
              location: assignForm.location,
            }
          : v
      )
    );

    setIsAssignModalOpen(false);
    setAssignForm({ vehicleId: "", guestName: "", location: "Guest House" });
  }

  /* ---------------- STATS ---------------- */
  const available = vehicles.filter((v) => v.status === "Available").length;
  const onDuty = vehicles.filter((v) => v.status === "On Duty").length;
  const inService = vehicles.filter((v) => v.status === "In Service").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Vehicle & Driver Management</h2>
          <p className="text-sm text-gray-600">
            वाहन और चालक प्रबंधन – Manage fleet and assignments
          </p>
        </div>
        <button
          className="nicPrimaryBtn"
          onClick={() => setIsAssignModalOpen(true)}
        >
          Assign Vehicle to Guest
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="statCard green">
          <p>Available Vehicles</p>
          <h3>{available}</h3>
        </div>
        <div className="statCard blue">
          <p>On Duty</p>
          <h3>{onDuty}</h3>
        </div>
        <div className="statCard yellow">
          <p>In Service</p>
          <h3>{inService}</h3>
        </div>
        <div className="statCard gray">
          <p>Total Fleet</p>
          <h3>{vehicles.length}</h3>
        </div>
      </div>

      {/* VEHICLE LIST */}
      <div className="bg-white border rounded-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-[#00247D]">Vehicle Fleet</h3>
        </div>

        <div className="p-6 space-y-4">
          {vehicles.map((v) => (
            <div key={v.id} className="vehicleCard">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className={`iconBox ${v.status.replace(" ", "")}`}>
                    <Car />
                  </div>
                  <div>
                    <p>{v.number}</p>
                    <p className="subText">{v.type}</p>
                  </div>
                </div>
                <span className={`statusPill ${v.status.replace(" ", "")}`}>
                  {v.status}
                </span>
              </div>

              <div className="details">
                {v.driver && (
                  <div>
                    <User /> Driver: {v.driver}
                  </div>
                )}
                {v.assignedTo && (
                  <div>
                    <User /> Assigned to: {v.assignedTo}
                  </div>
                )}
                <div>
                  <MapPin /> Location: {v.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ASSIGN VEHICLE MODAL */}
      {isAssignModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Assign Vehicle to Guest</h2>
              <button onClick={() => setIsAssignModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
              <div>
                <label>Vehicle *</label>
                <select
                  className="nicInput"
                  value={assignForm.vehicleId}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      vehicleId: e.target.value,
                    })
                  }
                >
                  <option value="">Select Vehicle</option>
                  {vehicles
                    .filter((v) => v.status === "Available")
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.number} – {v.type}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label>Guest Name *</label>
                <input
                  className="nicInput"
                  value={assignForm.guestName}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      guestName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Location</label>
                <input
                  className="nicInput"
                  value={assignForm.location}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      location: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setIsAssignModalOpen(false)}
              >
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
