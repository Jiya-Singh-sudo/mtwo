import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

/* ================= API ================= */

import {
  getActiveVehicles,
  createVehicle
} from "@/api/vehicles.api";

/* ================= UI TYPES (SAFE) ================= */

type VehicleRow = {
  number: string;
  name: string;
  status: "Available" | "On Duty";
};

type DriverRow = {
  driver_id: string;
  driver_name: string;
  driver_contact: string;
  driver_license: string | null;
  duty_status: "Available" | "Unavailable";
};

/* ================= COMPONENT ================= */

export default function DriverManagementPage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    number: "",
    name: "",
    capacity: 4
  });

  const [driverForm, setDriverForm] = useState({
    driver_name: "",
    driver_contact: "",
    driver_license: ""
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    const data = await getActiveVehicles();

    // map backend → UI
    const mapped: VehicleRow[] = data.map((v: any) => ({
      number: v.number,
      name: v.name,
      status: v.status
    }));

    setVehicles(mapped);
  }

  /* ================= ACTIONS ================= */

  async function handleAddVehicle() {
    await createVehicle({
      vehicle_no: vehicleForm.number,
      vehicle_name: vehicleForm.name,
      // manufacturer: vehicleForm.name.split(" ")[0],
      // year: new Date().getFullYear(),
      capacity: vehicleForm.capacity
    });

    setShowVehicleModal(false);
    setVehicleForm({ number: "", name: "", capacity: 4 });
    loadVehicles();
  }

  async function handleAddDriver() {
    // 🔴 Replace with your real drivers API
    setDrivers((prev) => [
      ...prev,
      {
        driver_id: Date.now().toString(),
        driver_name: driverForm.driver_name,
        driver_contact: driverForm.driver_contact,
        driver_license: driverForm.driver_license,
        duty_status: "Available"
      }
    ]);

    setShowDriverModal(false);
    setDriverForm({
      driver_name: "",
      driver_contact: "",
      driver_license: ""
    });
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold text-[#00247D]">
        Vehicle & Driver Management
      </h2>

      {/* VEHICLES */}
      <div className="bg-white border rounded p-4">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Vehicles</h3>
          <button
            onClick={() => setShowVehicleModal(true)}
            className="bg-[#00247D] text-white px-4 py-2 flex gap-2"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        <table className="w-full border">
          <thead className="bg-[#F5A623] text-white">
            <tr>
              <th className="p-2 text-left">Number</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.number} className="border-t">
                <td className="p-2">{v.number}</td>
                <td className="p-2">{v.name}</td>
                <td className="p-2">{v.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DRIVERS */}
      <div className="bg-white border rounded p-4">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Drivers</h3>
          <button
            onClick={() => setShowDriverModal(true)}
            className="bg-[#00247D] text-white px-4 py-2 flex gap-2"
          >
            <Plus size={16} /> Add Driver
          </button>
        </div>

        <table className="w-full border">
          <thead className="bg-[#F5A623] text-white">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Contact</th>
              <th className="p-2 text-left">License</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.driver_id} className="border-t">
                <td className="p-2">{d.driver_name}</td>
                <td className="p-2">{d.driver_contact}</td>
                <td className="p-2">{d.driver_license ?? "-"}</td>
                <td className="p-2">{d.duty_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 w-96 rounded space-y-3">
            <h3 className="font-semibold">Add Vehicle</h3>

            <input
              className="border p-2 w-full"
              placeholder="Vehicle Number"
              value={vehicleForm.number}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, number: e.target.value })
              }
            />

            <input
              className="border p-2 w-full"
              placeholder="Vehicle Name"
              value={vehicleForm.name}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, name: e.target.value })
              }
            />

            <button
              onClick={handleAddVehicle}
              className="bg-[#00247D] text-white px-4 py-2"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* ADD DRIVER MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 w-96 rounded space-y-3">
            <h3 className="font-semibold">Add Driver</h3>

            <input
              className="border p-2 w-full"
              placeholder="Driver Name"
              value={driverForm.driver_name}
              onChange={(e) =>
                setDriverForm({ ...driverForm, driver_name: e.target.value })
              }
            />

            <input
              className="border p-2 w-full"
              placeholder="Contact"
              value={driverForm.driver_contact}
              onChange={(e) =>
                setDriverForm({ ...driverForm, driver_contact: e.target.value })
              }
            />

            <input
              className="border p-2 w-full"
              placeholder="License"
              value={driverForm.driver_license}
              onChange={(e) =>
                setDriverForm({ ...driverForm, driver_license: e.target.value })
              }
            />

            <button
              onClick={handleAddDriver}
              className="bg-[#00247D] text-white px-4 py-2"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}