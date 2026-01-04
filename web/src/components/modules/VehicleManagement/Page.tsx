import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { getAllVehicles, createVehicle, updateVehicle, softDeleteVehicle } from '../../../api/vehicles.api';
import { fetchDrivers, createDriver, softDeleteDriver } from '../../../api/driver.api';
import { VehicleUpdateDto } from '../../../types/vehicles';
import { CreateDriverDto } from '../../../types/drivers';

interface Vehicle {
  vehicle_no: string;
  vehicle_name: string;
  model?: string | null;
  manufacturing?: string | null;
  capacity?: number | null;
  color?: string | null;
  is_active: boolean;
  inserted_at: string;
  inserted_by: string | null;
  inserted_ip: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  updated_ip?: string | null;
}

interface Driver {
  driver_id: string;
  driver_name: string;
  driver_name_ll?: string;
  driver_contact: string;
  driver_alternate_contact?: string;
  driver_license: string;
  address?: string;
  is_active: boolean;
  inserted_at: string;
  inserted_by: string;
  inserted_ip: string;
  updated_at?: string;
  updated_by?: string;
  updated_ip?: string;
}

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  useEffect(() => {
    async function loadVehicles() {
      try {
        const data = await getAllVehicles();
        setVehicles(data);
      } catch (err) {
        console.error('Failed to load vehicles', err);
      } finally {
        setVehicleLoading(false);
      }
    }

    loadVehicles();
  }, []);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverLoading, setDriverLoading] = useState(true);
  useEffect(() => {
    async function loadDrivers() {
      try {
        const data = await fetchDrivers();

        const normalized = data.map((d: any) => ({
          driver_id: d.driver_id,
          driver_name: d.driver_name,
          driver_name_ll: d.driver_name_local_language,
          driver_contact: d.driver_contact,
          driver_alternate_contact: d.driver_alternate_mobile,
          driver_license: d.driver_license,
          address: d.address,
          is_active: d.is_active,
          inserted_at: d.inserted_at,
        }));

        setDrivers(normalized);
      } catch (err) {
        console.error('Failed to load driver', err);
      } finally {
        setDriverLoading(false);
      }
    }

    loadDrivers();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Vehicle modals
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [showDeleteVehicleConfirm, setShowDeleteVehicleConfirm] = useState(false);

  // Driver modals
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showEditDriver, setShowEditDriver] = useState(false);
  const [showDeleteDriverConfirm, setShowDeleteDriverConfirm] = useState(false);


  const [vehicleFormData, setVehicleFormData] = useState<{
    vehicle_no: string;
    vehicle_name: string;
    model?: string;
    manufacturing?: string;
    capacity?: number;
    color?: string;
  }>({
    vehicle_no: '',
    vehicle_name: '',
    model: undefined,
    manufacturing: undefined,
    capacity: undefined,
    color: undefined,
  });

  const [driverFormData, setDriverFormData] = useState<{
    driver_name: string;
    driver_name_ll?: string;
    driver_contact: string;
    driver_alternate_contact?: string;
    driver_license: string;
    address?: string;
  }>({
    driver_name: '',
    driver_name_ll: undefined,
    driver_contact: '',
    driver_alternate_contact: undefined,
    driver_license: '',
    address: undefined,
  });

  // const [assignDriver, setAssignDriver] = useState('');

  // Vehicle handlers
  const handleAddVehicle = async () => {
    try {
      const saved = await createVehicle(vehicleFormData);
      setVehicles(prev => [...prev, saved]);
      setShowAddVehicle(false);
      resetVehicleForm();
    } catch (error) {
      console.error('Failed to create vehicle', error);
    }
  };


  const handleEditVehicle = async () => {
    if (!selectedVehicle) return;

    const payload: VehicleUpdateDto = {
      vehicle_name: vehicleFormData.vehicle_name,
      model: vehicleFormData.model,
      manufacturing: vehicleFormData.manufacturing,
      capacity: vehicleFormData.capacity,
      color: vehicleFormData.color,
    };

    const updated = await updateVehicle(selectedVehicle.vehicle_no, payload);

    setVehicles(prev =>
      prev.map(v => (v.vehicle_no === selectedVehicle.vehicle_no ? updated : v))
    );

    setShowEditVehicle(false);
  };


  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;

    await softDeleteVehicle(selectedVehicle.vehicle_no);

    setVehicles(prev =>
      prev.filter(v => v.vehicle_no !== selectedVehicle.vehicle_no)
    );

    setShowDeleteVehicleConfirm(false);
  };


  const openEditVehicleModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      vehicle_no: vehicle.vehicle_no,
      vehicle_name: vehicle.vehicle_name,
      model: vehicle.model ?? undefined,
      manufacturing: vehicle.manufacturing ?? undefined,
      capacity: vehicle.capacity ?? undefined,
      color: vehicle.color ?? undefined,
    });
    setShowEditVehicle(true);
  };

  const openDeleteVehicleDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteVehicleConfirm(true);
  };

  const resetVehicleForm = () => {
    setVehicleFormData({
      vehicle_no: '',
      vehicle_name: '',
      model: undefined,
      manufacturing: undefined,
      capacity: undefined,
      color: undefined,
    });
  };

  // Driver handlers
  const handleAddDriver = async () => {
    try {
      const payload: CreateDriverDto = {
        driver_name: driverFormData.driver_name,
        driver_name_ll: driverFormData.driver_name_ll,
        driver_contact: driverFormData.driver_contact,
        driver_alternate_contact: driverFormData.driver_alternate_contact,
        driver_license: driverFormData.driver_license,
        address: driverFormData.address,
      };

      const saved = await createDriver(payload);
      setDrivers(prev => [...prev, saved]);
      setShowAddDriver(false);
      resetDriverForm();
    } catch (error) {
      console.error('Failed to create driver', error);
    }
  };


  const handleEditDriver = () => {
    if (selectedDriver) {
      setDrivers(drivers.map(d => d.driver_id === selectedDriver.driver_id ? { ...selectedDriver, ...driverFormData } : d));
      setShowEditDriver(false);
      setSelectedDriver(null);
      resetDriverForm();
    }
  };

  const handleDeleteDriver = async () => {
    if (!selectedDriver) return;
    await softDeleteDriver(selectedDriver.driver_id);
    setDrivers(prev =>
      prev.filter(v => v.driver_id !== selectedDriver.driver_id)
    );
    setShowDeleteDriverConfirm(false);
    setSelectedDriver(null);
  };

  const openEditDriverModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverFormData({
      driver_name: driver.driver_name,
      driver_name_ll: driver.driver_name_ll,
      driver_contact: driver.driver_contact,
      driver_alternate_contact: driver.driver_alternate_contact,
      driver_license: driver.driver_license,
      address: driver.address
    });
    setShowEditDriver(true);
  };

  const openDeleteDriverDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDeleteDriverConfirm(true);
  };

  const resetDriverForm = () => {
    setDriverFormData({
      driver_name: '',
      driver_name_ll: undefined,
      driver_contact: '',
      driver_alternate_contact: undefined,
      driver_license: '',
      address: undefined,
    });
  };

  const filteredVehicles = vehicles.filter(v =>
    v.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.driver_contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-[#00247D]">Vehicle & Driver Management</h2>
        <p className="text-gray-600 text-sm mt-1">Manage vehicles and drivers | वाहन औ�� चालक प्रबंधन</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vehicles" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-6">
          {/* Search and Add */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md bg-white border border-gray-200 rounded-sm p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                console.log('Clicked Add Vehicle');
                setShowAddVehicle(true);
              }}
              className="bg-[#00247D] hover:bg-[#003399] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </div>

          {/* Vehicle List Table */}
          {vehicleLoading ? (
            <div className="bg-white border border-gray-200 rounded-sm p-6 text-sm text-gray-500">
              Loading vehicles…
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5A623] text-white">
                      <th className="px-4 py-3 text-left text-sm">Vehicle No</th>
                      <th className="px-4 py-3 text-left text-sm">Vehicle Name</th>
                      <th className="px-4 py-3 text-left text-sm">Model</th>
                      <th className="px-4 py-3 text-left text-sm">Manufacturing</th>
                      <th className="px-4 py-3 text-left text-sm">Color</th>
                      <th className="px-4 py-3 text-left text-sm">Capacity</th>
                      <th className="px-4 py-3 text-left text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle, index) => (
                      <tr key={`${vehicle.vehicle_no ?? vehicle.vehicle_name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-900">
                          {vehicle.vehicle_no}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {vehicle.vehicle_name}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {vehicle.model ?? '-'}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {vehicle.manufacturing ?? '-'}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {vehicle.capacity ?? '-'}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {vehicle.color ?? '-'}
                        </td>

                        <td className="px-4 py-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditVehicleModal(vehicle)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteVehicleDialog(vehicle)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          {/* Search and Add */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md bg-white border border-gray-200 rounded-sm p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={() => setShowAddDriver(true)}
              className="bg-[#00247D] hover:bg-[#003399] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </div>

          {/* Driver List Table */}
          {driverLoading ? (
            <div className="bg-white border border-gray-200 rounded-sm p-6 text-sm text-gray-500">
              Loading drivers…
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F5A623] text-white">
                      <th className="px-4 py-3 text-left text-sm">Driver Name</th>
                      <th className="px-4 py-3 text-left text-sm">Driver Name in Local Language</th>
                      <th className="px-4 py-3 text-left text-sm">Contact</th>
                      <th className="px-4 py-3 text-left text-sm">Alternate Contact</th>
                      <th className="px-4 py-3 text-left text-sm">License No</th>
                      <th className="px-4 py-3 text-left text-sm">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((driver, index) => (
                      <tr
                        key={`${driver.driver_id ?? 'tmp'}-${driver.driver_contact}-${index}`}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-900">
                          {driver.driver_name}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.driver_name_ll || '-'}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.driver_contact}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.driver_alternate_contact || '-'}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.driver_license}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.address || '-'}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditDriverModal(driver)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteDriverDialog(driver)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Add Vehicle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                <input
                  type="text"
                  value={vehicleFormData.vehicle_no}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_no: e.target.value })}
                  placeholder="MH-01-XX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name *</label>
                <input
                  type="text"
                  value={vehicleFormData.vehicle_name}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_name: e.target.value })}
                  placeholder="e.g., Toyota Fortuner"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={vehicleFormData.model ?? ''}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value || undefined })}
                  placeholder="e.g., ZX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Year</label>
                <input
                  type="text"
                  value={vehicleFormData.manufacturing ?? ''}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, manufacturing: e.target.value || undefined })}
                  placeholder="e.g., 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={vehicleFormData.capacity ?? ''}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, capacity: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g., 5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={vehicleFormData.color ?? ''}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, color: e.target.value || undefined })}
                  placeholder="e.g., White"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
            </div>
            <div className="modalActions">
              <button
                className="linkBtn"
                onClick={() => {
                  setShowAddVehicle(false);
                  resetVehicleForm();
                }}
              >
                Cancel
              </button>

              <button className="primaryBtn" onClick={handleAddVehicle}>
                Add Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditVehicle && selectedVehicle && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Edit Vehicle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                <input
                  type="text"
                  value={vehicleFormData.vehicle_no}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name *</label>
                <input
                  type="text"
                  value={vehicleFormData.vehicle_name}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={vehicleFormData.model ?? ''}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Year</label>
                <input
                  type="text"
                  value={vehicleFormData.manufacturing ?? ''}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, manufacturing: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={vehicleFormData.capacity ?? ''}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, capacity: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={vehicleFormData.color ?? ''}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, color: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00247D]"
                />
              </div>
            </div>
            <div className="modalActions">
              <button
                onClick={() => { setShowEditVehicle(false); resetVehicleForm(); }}
                className="linkBtn"
              >
                Cancel
              </button>
              <button
                onClick={handleEditVehicle}
                className="primaryBtn"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddDriver && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Add Driver</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="driverName">Full Name *</Label>
                <Input
                  id="driverName"
                  value={driverFormData.driver_name}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="driverNameLocal">Full Name (Local)</Label>
                <Input
                  id="driverNameLocal"
                  value={driverFormData.driver_name_ll ?? ''}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_name_ll: e.target.value || undefined })}
                  placeholder="Enter full name in local language"
                />
              </div>
              <div>
                <Label htmlFor="driverContact">Contact Number *</Label>
                <Input
                  id="driverContact"
                  value={driverFormData.driver_contact}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_contact: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <Label htmlFor="driverAlternateContact">Alternate Contact Number</Label>
                <Input
                  id="driverAlternateContact"
                  value={driverFormData.driver_alternate_contact ?? ''}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_alternate_contact: e.target.value || undefined })}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <Label htmlFor="licenseNo">License Number *</Label>
                <Input
                  id="licenseNo"
                  value={driverFormData.driver_license}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_license: e.target.value })}
                  placeholder="MH-XXXXXXXXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="driverAddress">Address</Label>
                <Input
                  id="driverAddress"
                  value={driverFormData.address ?? ''}
                  onChange={(e) => setDriverFormData({ ...driverFormData, address: e.target.value || undefined })}
                  placeholder="Enter address"
                />
              </div>
            </div>
            <div className="modalActions">
              <button
                onClick={() => { setShowAddDriver(false); resetDriverForm(); }}
                className="linkBtn"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDriver}
                className="primaryBtn"
              >
                Add Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditDriver && selectedDriver && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Edit Driver</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-driverName">Full Name *</Label>
                <Input
                  id="edit-driverName"
                  value={driverFormData.driver_name}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-driverNameLocal">Full Name (Local)</Label>
                <Input
                  id="edit-driverNameLocal"
                  value={driverFormData.driver_name_ll ?? ''}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_name_ll: e.target.value || undefined })}
                />
              </div>
              <div>
                <Label htmlFor="edit-driverContact">Contact Number *</Label>
                <Input
                  id="edit-driverContact"
                  value={driverFormData.driver_contact}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_contact: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-driverAlternateMobile">Alternate Contact Number</Label>
                <Input
                  id="edit-driverAlternateMobile"
                  value={driverFormData.driver_alternate_contact ?? ''}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_alternate_contact: e.target.value || undefined })}
                />
              </div>
              <div>
                <Label htmlFor="edit-licenseNo">License Number *</Label>
                <Input
                  id="edit-licenseNo"
                  value={driverFormData.driver_license}
                  onChange={(e) => setDriverFormData({ ...driverFormData, driver_license: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-driverAddress">Address</Label>
                <Input
                  id="edit-driverAddress"
                  value={driverFormData.address ?? ''}
                  onChange={(e) => setDriverFormData({ ...driverFormData, address: e.target.value || undefined })}
                />
              </div>
            </div>
            <div className="modalActions">
              <button
                onClick={() => { setShowEditDriver(false); resetDriverForm(); }}
                className="linkBtn"
              >
                Cancel
              </button>
              <button
                onClick={handleEditDriver}
                className="primaryBtn"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Vehicle Confirmation */}
      {showDeleteVehicleConfirm && selectedVehicle && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete vehicle <strong>{selectedVehicle.vehicle_no}</strong>? This action cannot be undone.
            </p>
            <div className="modalActions">
              <button
                onClick={() => setShowDeleteVehicleConfirm(false)}
                className="linkBtn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVehicle}
                className="primaryBtn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Driver Confirmation */}
      {showDeleteDriverConfirm && selectedDriver && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete driver <strong>{selectedDriver.driver_name}</strong>? This action cannot be undone.
            </p>
            <div className="modalActions">
              <button
                onClick={() => setShowDeleteDriverConfirm(false)}
                className="linkBtn"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDriver}
                className="primaryBtn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
