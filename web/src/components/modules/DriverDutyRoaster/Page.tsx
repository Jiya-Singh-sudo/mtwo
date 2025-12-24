import { useState, ChangeEvent } from "react";
import { Plus, UserCheck, Eye } from "lucide-react";

/* ================= TYPES ================= */

type TripStatus = "Scheduled" | "Ongoing" | "Completed" | "Cancelled";

interface Vehicle {
  vehicleNo: string;
  model: string;
  capacity: number;
  driverId?: string;
}

interface Driver {
  driverId: string;
  name: string;
  contact: string;
  license: string;
}

interface GuestAssignment {
  guestName: string;
  pickup: string;
  drop: string;
  status: TripStatus;
  driverId: string;
  vehicleNo: string;
}

/* ================= COMPONENT ================= */

export function Page() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [guests, setGuests] = useState<GuestAssignment[]>([]);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);

  const [vehicleForm, setVehicleForm] = useState<Vehicle>({
    vehicleNo: "",
    model: "",
    capacity: 0,
  });

  const [driverForm, setDriverForm] = useState<Driver>({
    driverId: "",
    name: "",
    contact: "",
    license: "",
  });

  const [guestForm, setGuestForm] = useState<GuestAssignment>({
    guestName: "",
    pickup: "",
    drop: "",
    status: "Scheduled",
    driverId: "",
    vehicleNo: "",
  });

  const [error, setError] = useState<string>("");

  /* ================= VALIDATION ================= */

  const validateVehicle = (): boolean => {
    if (!/^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}$/.test(vehicleForm.vehicleNo)) {
      setError("Invalid vehicle number format (MH-01-AB-1234)");
      return false;
    }
    if (!vehicleForm.model || vehicleForm.capacity <= 0) {
      setError("Model and capacity are required");
      return false;
    }
    return true;
  };

  const validateDriver = (): boolean => {
    if (!driverForm.name) {
      setError("Driver name required");
      return false;
    }
    if (!/^\d{10}$/.test(driverForm.contact)) {
      setError("Contact must be exactly 10 digits");
      return false;
    }
    return true;
  };

  const validateGuest = (): boolean => {
    if (!guestForm.guestName || !guestForm.pickup || !guestForm.drop) {
      setError("All guest fields are required");
      return false;
    }
    return true;
  };

  /* ================= ACTIONS ================= */

  const addVehicle = () => {
    if (!validateVehicle()) return;
    setVehicles([...vehicles, vehicleForm]);
    setVehicleForm({ vehicleNo: "", model: "", capacity: 0 });
    setShowVehicleModal(false);
    setError("");
  };

  const addDriver = () => {
    if (!validateDriver()) return;
    setDrivers([...drivers, driverForm]);
    setDriverForm({ driverId: "", name: "", contact: "", license: "" });
    setShowDriverModal(false);
    setError("");
  };

  const assignDriver = (vehicleNo: string, driverId: string) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.vehicleNo === vehicleNo ? { ...v, driverId } : v
      )
    );
  };

  const addGuest = () => {
    if (!validateGuest()) return;
    setGuests([...guests, guestForm]);
    setShowGuestModal(false);
    setGuestForm({
      guestName: "",
      pickup: "",
      drop: "",
      status: "Scheduled",
      driverId: "",
      vehicleNo: "",
    });
    setError("");
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-xl font-semibold text-[#00247D]">
        Vehicle & Driver Management
      </h2>

      {/* ================= VEHICLES ================= */}

      <div className="bg-white border p-4 rounded">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Vehicles</h3>
          <button
            className="bg-[#00247D] text-white px-4 py-2 flex gap-2"
            onClick={() => setShowVehicleModal(true)}
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        <table className="w-full border">
          <thead className="bg-[#F5A623] text-white">
            <tr>
              <th className="p-2">Vehicle No</th>
              <th className="p-2">Model</th>
              <th className="p-2">Capacity</th>
              <th className="p-2">Assign Driver</th>
              <th className="p-2">View</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.vehicleNo} className="border-t">
                <td className="p-2">{v.vehicleNo}</td>
                <td className="p-2">{v.model}</td>
                <td className="p-2">{v.capacity}</td>
                <td className="p-2">
                  <select
                    className="border p-1"
                    value={v.driverId || ""}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      assignDriver(v.vehicleNo, e.target.value)
                    }
                  >
                    <option value="">Assign</option>
                    {drivers.map((d) => (
                      <option key={d.driverId} value={d.driverId}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <button onClick={() => setDetailVehicle(v)}>
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= DRIVERS ================= */}

      <div className="bg-white border p-4 rounded">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Drivers</h3>
          <button
            className="bg-[#00247D] text-white px-4 py-2 flex gap-2"
            onClick={() => setShowDriverModal(true)}
          >
            <Plus size={16} /> Add Driver
          </button>
        </div>

        <table className="w-full border">
          <thead className="bg-[#F5A623] text-white">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Contact</th>
              <th className="p-2">License</th>
              <th className="p-2">Guest</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.driverId} className="border-t">
                <td className="p-2">{d.name}</td>
                <td className="p-2">{d.contact}</td>
                <td className="p-2">{d.license}</td>
                <td className="p-2">
                  <button
                    className="flex items-center gap-1 text-blue-600"
                    onClick={() => {
                      setGuestForm({ ...guestForm, driverId: d.driverId });
                      setShowGuestModal(true);
                    }}
                  >
                    <UserCheck size={16} /> Assign Guest
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= VEHICLE DETAIL MODAL ================= */}

      {detailVehicle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 w-96 rounded">
            <h3 className="font-semibold mb-3">Vehicle Details</h3>
            <p><strong>Vehicle No:</strong> {detailVehicle.vehicleNo}</p>
            <p><strong>Model:</strong> {detailVehicle.model}</p>
            <p><strong>Capacity:</strong> {detailVehicle.capacity}</p>
            <button
              className="mt-4 px-4 py-2 bg-[#00247D] text-white"
              onClick={() => setDetailVehicle(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ================= GUEST MODAL ================= */}

      {showGuestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 w-96 rounded">
            <h3 className="font-semibold mb-3">Assign Guest</h3>

            <input
              className="border p-2 w-full mb-2"
              placeholder="Guest Name"
              value={guestForm.guestName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setGuestForm({ ...guestForm, guestName: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              placeholder="Pickup Location"
              value={guestForm.pickup}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setGuestForm({ ...guestForm, pickup: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              placeholder="Drop Location"
              value={guestForm.drop}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setGuestForm({ ...guestForm, drop: e.target.value })
              }
            />

            {error && <p className="text-red-600">{error}</p>}

            <button
              className="bg-[#00247D] text-white px-4 py-2 mt-2"
              onClick={addGuest}
            >
              Assign
            </button>
          </div>
        </div>
      )}

      {/* ================= ADD VEHICLE MODAL ================= */}

      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 w-96 rounded">
            <h3 className="font-semibold mb-3">Add Vehicle</h3>

            <input
              className="border p-2 w-full mb-2"
              placeholder="MH-01-AB-1234"
              value={vehicleForm.vehicleNo}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setVehicleForm({ ...vehicleForm, vehicleNo: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              placeholder="Model"
              value={vehicleForm.model}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setVehicleForm({ ...vehicleForm, model: e.target.value })
              }
            />

            <input
              type="number"
              className="border p-2 w-full mb-2"
              placeholder="Capacity"
              value={vehicleForm.capacity}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setVehicleForm({
                  ...vehicleForm,
                  capacity: Number(e.target.value),
                })
              }
            />

            {error && <p className="text-red-600">{error}</p>}

            <button
              className="bg-[#00247D] text-white px-4 py-2"
              onClick={addVehicle}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* ================= ADD DRIVER MODAL ================= */}

      {showDriverModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 w-96 rounded">
            <h3 className="font-semibold mb-3">Add Driver</h3>

            <input
              className="border p-2 w-full mb-2"
              placeholder="Driver ID"
              value={driverForm.driverId}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDriverForm({ ...driverForm, driverId: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              placeholder="Name"
              value={driverForm.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDriverForm({ ...driverForm, name: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              placeholder="Contact"
              value={driverForm.contact}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDriverForm({ ...driverForm, contact: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              placeholder="License"
              value={driverForm.license}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDriverForm({ ...driverForm, license: e.target.value })
              }
            />

            {error && <p className="text-red-600">{error}</p>}

            <button
              className="bg-[#00247D] text-white px-4 py-2"
              onClick={addDriver}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default Page;