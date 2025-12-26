import { useState } from 'react';
import { Driver } from '../../../types/drivers';
import { DriverCard } from './DriverCard';
import { DriverViewDialog } from './DriverViewDialog';
import { DriverEditDialog } from './DriverEditDialog';
import { DeleteConfirmDialog } from '../../DeleteConfirmDialog';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface DriverManagementProps {
  drivers: Driver[];
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (driverId: string) => void;
}

export function DriverManagement({ drivers, onUpdateDriver, onDeleteDriver }: DriverManagementProps) {
  const [searchQuery] = useState('');
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);

  const filteredDrivers = drivers.filter((driver) =>
    driver.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.driver_contact.includes(searchQuery) ||
    driver.driver_license.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteDriver) {
      onDeleteDriver(deleteDriver.driver_id);
      setDeleteDriver(null);
    }
  };

  const handleToggleStatus = (driver: Driver) => {
    const updatedDriver = {
      ...driver,
      is_active: !driver.is_active
    };
    onUpdateDriver(updatedDriver);
    toast.success(`Driver ${updatedDriver.is_active ? 'activated' : 'deactivated'}`);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Driver Management Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Driver List</h2>
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <UserPlus className="size-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-base md:text-lg mb-2 text-gray-900">No drivers found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding a driver'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((driver) => (
              <DriverCard
                key={driver.driver_id}
                driver={driver}
                onView={setViewDriver}
                onEdit={setEditDriver}
                onDelete={setDeleteDriver}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      <DriverViewDialog
        driver={viewDriver}
        open={!!viewDriver}
        onOpenChange={(open) => !open && setViewDriver(null)}
      />

      <DriverEditDialog
        driver={editDriver}
        open={!!editDriver}
        onOpenChange={(open) => !open && setEditDriver(null)}
        onSave={onUpdateDriver}
      />

      <DeleteConfirmDialog
        open={!!deleteDriver}
        onOpenChange={(open) => !open && setDeleteDriver(null)}
        onConfirm={handleDelete}
        title="Delete Driver"
        description="Are you sure you want to delete this driver? This action cannot be undone."
        itemName={deleteDriver?.driver_name}
      />
    </div>
  );
}