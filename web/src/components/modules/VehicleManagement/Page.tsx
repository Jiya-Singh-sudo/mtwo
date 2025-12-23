import { useState } from "react";
import { User, Phone, Shield, Clock, X, Eye, Car } from "lucide-react";
import "./VehicleManagement.css";

/* ---------------- TYPES ---------------- */
interface Vehicle {
  number: string;
  name: string;
  type: string;
  modelYear: string;
  capacity: number;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  license: string;
  shift: string;
  status: "Available" | "On Duty";
  vehicle: Vehicle | null;
  assignedTo: string | null;
  pickupLocation: string | null;
  dropLocation: string | null;
  guestRoomNo: string | null;
  assignedAt: string | null;
  releasedAt: string | null;
  experience: string;
  rating: string;
}

/* ---------------- MASTER DATA ---------------- */
const vehicles: Vehicle[] = [
  {
    number: "DL-01-AB-1234",
    name: "Toyota Innova",
    type: "SUV",
    modelYear: "2022",
    capacity: 7,
  },
  {
    number: "DL-01-CD-5678",
    name: "Maruti Dzire",
    type: "Sedan",
    modelYear: "2021",
    capacity: 5,
  },
];

const guests = [
  "Shri Rajesh Kumar",
  "Smt. Anjali Verma",
  "Shri Amit Sharma",
];

const locations = [
  "Guest House",
  "Airport",
  "Secretariat",
  "Collector Office",
];

export default function VehicleManagement() {
  /* ---------------- STATE ---------------- */
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "D001",
      name: "Ram Singh",
      phone: "+91-9876543210",
      license: "DL-1420110012345",
      shift: "Day Shift",
      status: "On Duty",
      vehicle: vehicles[0],
      assignedTo: "Shri Rajesh Kumar",
      pickupLocation: "Guest House",
      dropLocation: "Secretariat",
      guestRoomNo: "101",
      assignedAt: "2025-02-01T09:00",
      releasedAt: "2025-02-05T18:00",
      experience: "15 years",
      rating: "4.8/5",
    },
    {
      id: "D002",
      name: "Mohan Kumar",
      phone: "+91-9876512345",
      license: "DL-1420110054321",
      shift: "Day Shift",
      status: "Available",
      vehicle: null,
      assignedTo: null,
      pickupLocation: null,
      dropLocation: null,
      guestRoomNo: null,
      assignedAt: null,
      releasedAt: null,
      experience: "12 years",
      rating: "4.6/5",
    },
  ]);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [assignForm, setAssignForm] = useState({
    vehicleNumber: "",
    guestName: "",
    pickupLocation: "",
    dropLocation: "",
    guestRoomNo: "",
    assignedAt: "",
    releasedAt: "",
  });

  /* ---------------- DERIVED ---------------- */
  const assignedVehicleNumbers = drivers
    .map((d) => d.vehicle?.number)
    .filter(Boolean) as string[];

  const availableVehicles = vehicles.filter(
    (v) => !assignedVehicleNumbers.includes(v.number)
  );

  /* ---------------- ASSIGN VEHICLE ---------------- */
  function assignVehicle() {
    if (!selectedDriver) return;

    const vehicle = vehicles.find(
      (v) => v.number === assignForm.vehicleNumber
    );
    if (!vehicle) return alert("Select vehicle");

    setDrivers((prev) =>
      prev.map((d) =>
        d.id === selectedDriver.id
          ? {
              ...d,
              vehicle,
              assignedTo: assignForm.guestName,
              pickupLocation: assignForm.pickupLocation,
              dropLocation: assignForm.dropLocation,
              guestRoomNo: assignForm.guestRoomNo,
              assignedAt: assignForm.assignedAt,
              releasedAt: assignForm.releasedAt,
              status: "On Duty",
            }
          : d
      )
    );

    setIsAssignModalOpen(false);
    setSelectedDriver(null);
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-[#00247D]">Driver Management Dashboard</h2>

        <div className="bg-white border rounded-sm p-6">
          {drivers.map((driver) => (
            <div key={driver.id} className="vehicleCard">
              {/* HEADER */}
              <div className="flex justify-between mb-3">
                <div className="flex gap-3">
                  <User />
                  <div>
                    <p>{driver.name}</p>
                    <p className="subText">{driver.id}</p>
                  </div>
                </div>
                <span className="statusPill">{driver.status}</span>
              </div>

              {/* DETAILS */}
              <div className="details">
                <div><Shield /> {driver.license}</div>
                <div><Phone /> {driver.phone}</div>
                <div><Clock /> {driver.shift}</div>

                {/* FIRST DETAIL — CAR ICON + NUMBER + NAME */}
                {driver.vehicle && (
                  <div className="flex gap-2 items-center mt-2">
                    <Car size={16} />
                    <strong>
                      {driver.vehicle.number} – {driver.vehicle.name}
                    </strong>
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 mt-3">
                <button
                  className="assignBtn"
                  onClick={() => {
                    setSelectedDriver(driver);
                    setIsAssignModalOpen(true);
                  }}
                >
                  Assign Vehicle
                </button>

                {driver.vehicle && (
                  <button
                    className="assignBtn"
                    onClick={() => {
                      setSelectedDriver(driver);
                      setIsViewModalOpen(true);
                    }}
                  >
                    <Eye size={16} className="mr-1" />
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- VIEW DETAILS MODAL ---------------- */}
      {isViewModalOpen && selectedDriver && selectedDriver.vehicle && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Vehicle Details</h2>
              <button onClick={() => setIsViewModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
              <p><strong>Vehicle No:</strong> {selectedDriver.vehicle.number}</p>
              <p><strong>Vehicle Name:</strong> {selectedDriver.vehicle.name}</p>
              <p><strong>Type:</strong> {selectedDriver.vehicle.type}</p>
              <p><strong>Model:</strong> {selectedDriver.vehicle.modelYear}</p>
              <p><strong>Capacity:</strong> {selectedDriver.vehicle.capacity} Seater</p>

              <hr />

              <p><strong>Assigned To:</strong> {selectedDriver.assignedTo}</p>
              <p><strong>Pickup:</strong> {selectedDriver.pickupLocation}</p>
              <p><strong>Drop:</strong> {selectedDriver.dropLocation}</p>
              <p><strong>Guest Room:</strong> {selectedDriver.guestRoomNo}</p>
              <p><strong>Check-in:</strong> {selectedDriver.assignedAt}</p>
              <p><strong>Check-out:</strong> {selectedDriver.releasedAt}</p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- ASSIGN MODAL ---------------- */}
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
                onChange={(e) =>
                  setAssignForm({ ...assignForm, vehicleNumber: e.target.value })
                }
              >
                <option value="">Select Vehicle</option>
                {availableVehicles.map((v) => (
                  <option key={v.number} value={v.number}>
                    {v.number} – {v.name}
                  </option>
                ))}
              </select>

              <select
                className="nicInput"
                onChange={(e) =>
                  setAssignForm({ ...assignForm, guestName: e.target.value })
                }
              >
                <option value="">Select Guest</option>
                {guests.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                className="nicInput"
                onChange={(e) =>
                  setAssignForm({ ...assignForm, pickupLocation: e.target.value })
                }
              >
                <option value="">Pickup Location</option>
                {locations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              <select
                className="nicInput"
                onChange={(e) =>
                  setAssignForm({ ...assignForm, dropLocation: e.target.value })
                }
              >
                <option value="">Drop Location</option>
                {locations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              <input
                className="nicInput"
                placeholder="Guest Room No"
                onChange={(e) =>
                  setAssignForm({ ...assignForm, guestRoomNo: e.target.value })
                }
              />

              <input
                type="datetime-local"
                className="nicInput"
                onChange={(e) =>
                  setAssignForm({ ...assignForm, assignedAt: e.target.value })
                }
              />

              <input
                type="datetime-local"
                className="nicInput"
                onChange={(e) =>
                  setAssignForm({ ...assignForm, releasedAt: e.target.value })
                }
              />
            </div>

            <div className="nicModalActions">
              <button onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
              <button className="saveBtn" onClick={assignVehicle}>
                Assign Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
