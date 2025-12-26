import { useEffect, useState } from "react";
import { Driver } from "../../../types/drivers";
import { Vehicle } from "../../../types/vehicles";
import { fetchDrivers, deleteDriver } from "../../../api/driver.api";
import { getVehicles } from "../../../api/vehicles.api";

import DriversSection from "./drivers-section";
import VehiclesSection from "./vehicles-section";
import ViewDriverModal from "./view-driver-modal";
import EditDriverModal from "./edit-driver-modal";
import ConfirmDeleteDialog from "./confirm-delete-dialog";

import { notifySuccess } from "../../common/toast";

export default function DriverManagementPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Driver modals
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [d, v] = await Promise.all([
      fetchDrivers(),
      getVehicles()
    ]);
    setDrivers(d);
    setVehicles(v);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteDriver(deleteTarget.driver_id);
    notifySuccess("Driver deleted");
    setDeleteTarget(null);
    loadAll();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-[#002D62]">
        Vehicle & Driver Management
      </h2>

      <VehiclesSection vehicles={vehicles} />

      <DriversSection
        drivers={drivers}
        onView={setViewDriver}
        onEdit={setEditDriver}
        onDelete={setDeleteTarget}
      />

      {/* VIEW */}
      <ViewDriverModal
        open={!!viewDriver}
        driver={viewDriver}
        onClose={() => setViewDriver(null)}
      />

      {/* EDIT */}
      <EditDriverModal
        open={!!editDriver}
        driver={editDriver}
        onClose={() => setEditDriver(null)}
        onSaved={loadAll}
      />

      {/* DELETE */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Delete Driver"
        description="This action cannot be undone."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
