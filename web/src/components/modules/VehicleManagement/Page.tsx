// src/components/modules/VehicleManagement/Page.tsx
import { useState, useEffect } from "react";
import { Car, User, MapPin, X } from "lucide-react";
import {
  getVehicleFleet,
  getAssignableVehicles,
  getGuestsWithoutVehicle,
  assignVehicleToGuest
} from "../../../api/guestVehicle.api";
import "./VehicleManagement.css";


export function VehicleManagement() {

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const available = vehicles.filter(v => v.status === "AVAILABLE").length;
  const onDuty = vehicles.filter(v => v.status === "ON_DUTY").length;
  const inService = vehicles.filter(v => v.status === "IN_SERVICE").length;


  useEffect(() => {
    loadFleet();
  }, []);

  async function loadFleet() {
    setLoading(true);
    const data = await getVehicleFleet();
    setVehicles(data);
    setLoading(false);
  }


  /* ---------------- MODAL STATE ---------------- */
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    vehicle_no: "",
    guest_id: "",
    location: "Guest House",
  });
  const [assignableVehicles, setAssignableVehicles] = useState<any[]>([]);
  const [assignableGuests, setAssignableGuests] = useState<any[]>([]);


  async function openAssignVehicleModal() {
    const [vehicles, guests] = await Promise.all([
      getAssignableVehicles(),
      getGuestsWithoutVehicle(),
    ]);

    setAssignableVehicles(vehicles);
    setAssignableGuests(guests);
    setIsAssignModalOpen(true);
  }



  /* ---------------- ACTIONS ---------------- */
  async function submitAssignVehicle() {
    if (!assignForm.vehicle_no || !assignForm.guest_id) {
      alert("Vehicle and Guest are required");
      return;
    }

    await assignVehicleToGuest({
      vehicle_no: assignForm.vehicle_no,
      guest_id: Number(assignForm.guest_id),
      location: assignForm.location,
    });

    setIsAssignModalOpen(false);
    setAssignForm({
      vehicle_no: "",
      guest_id: "",
      location: "Guest House",
    });

    await loadFleet(); // refresh truth
  }



  // /* ---------------- STATS ---------------- */
  // const available = vehicles.filter((v) => v.status === "AVAILABLE").length;
  // const onDuty = vehicles.filter((v) => v.status === "ON_DUTY").length;
  // const inService = vehicles.filter((v) => v.status === "IN_SERVICE").length;

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
          onClick={() => openAssignVehicleModal()}
        >
          Assign Vehicle to Guest
        </button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="animate-spin">⏳</span>
          Loading vehicles...
        </div>
      )}


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
                    <p>{v.vehicle_no}</p>
                    <p className="subText">{v.vehicle_name}</p>
                  </div>
                </div>
                <span className={`statusPill ${v.status.replace(" ", "")}`}>
                  {v.status}
                </span>
              </div>

              <div className="details">
                {v.driver_name && (
                  <div>
                    <User /> Driver: {v.driver_name}
                  </div>
                )}
                {v.guest_name && (
                  <div>
                    <User /> Assigned to: {v.guest_name}
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
                  value={assignForm.vehicle_no}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      vehicle_no: e.target.value,
                    })
                  }
                >
                  <option value="">Select Vehicle</option>
                  {assignableVehicles.map((v) => (
                    <option key={v.vehicle_no} value={v.vehicle_no}>
                      {v.vehicle_no} – {v.vehicle_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Guest Name *</label>
                <select
                  className="nicInput"
                  value={assignForm.guest_id}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, guest_id: e.target.value })
                  }
                >
                  <option value="">Select Guest</option>
                  {assignableGuests.map((g) => (
                    <option key={g.guest_id} value={g.guest_id}>
                      {g.guest_name}
                    </option>
                  ))}
                </select>

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
export default VehicleManagement;
