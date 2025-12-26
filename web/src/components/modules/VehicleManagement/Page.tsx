import { useState } from 'react';
import { Vehicle } from '../../../types/vehicles';
import { VehicleCard } from './VehicleCard';
import { VehicleViewDialog } from './VehicleViewDialog';
import { VehicleEditDialog } from './VehicleEditDialog';
import { DeleteConfirmDialog } from '../../DeleteConfirmDialog';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Search, Plus, Car } from 'lucide-react';

interface VehicleManagementProps {
  vehicles: Vehicle[];
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  onAssignVehicle: (vehicle: Vehicle) => void;
}

export function VehicleManagement({
  vehicles,
  onUpdateVehicle,
  onDeleteVehicle,
  onAssignVehicle,
}: VehicleManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewVehicle, setViewVehicle] = useState<Vehicle | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteVehicle) {
      onDeleteVehicle(deleteVehicle.vehicle_no);
      setDeleteVehicle(null);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl mb-2">Vehicle & Driver Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">Overview of your fleet and current assignments</p>
          </div>
          <Button className="sm:w-auto w-full">
            <Plus className="size-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            placeholder="Search vehicles by number or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg md:text-xl mb-4">Vehicle Fleet</h2>
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Car className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-base md:text-lg mb-2">No vehicles found</h3>
            <p className="text-sm md:text-base text-muted-foreground">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding a vehicle'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.vehicle_no}
                vehicle={vehicle}
                onView={setViewVehicle}
                onEdit={setEditVehicle}
                onDelete={setDeleteVehicle}
                onAssign={onAssignVehicle}
              />
            ))}
          </div>
        )}
      </div>

      <VehicleViewDialog
        vehicle={viewVehicle}
        open={!!viewVehicle}
        onOpenChange={(open) => !open && setViewVehicle(null)}
      />

      <VehicleEditDialog
        vehicle={editVehicle}
        open={!!editVehicle}
        onOpenChange={(open) => !open && setEditVehicle(null)}
        onSave={onUpdateVehicle}
      />

      <DeleteConfirmDialog
        open={!!deleteVehicle}
        onOpenChange={(open) => !open && setDeleteVehicle(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        description="Are you sure you want to delete this vehicle? This action cannot be undone."
        itemName={deleteVehicle?.vehicle_no}
      />
    </div>
  );
}