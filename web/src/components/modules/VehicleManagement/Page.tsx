import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Car as CarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { getAllVehicles, createVehicle, updateVehicle, softDeleteVehicle } from '../../../api/vehicles.api';
import { fetchDrivers, createDriver } from '../../../api/driver.api';
import { VehicleUpdateDto } from '../../../types/vehicles';
import { CreateDriverDto } from '../../../types/drivers';

interface Vehicle {
  vehicle_id: string;
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
  driver_name_local?: string;
  driver_contact: string;
  driver_alternate_mobile?: string;
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
        setDrivers(data);
      } catch (err) {
        console.error('Failed to load driver', err);
      } finally {
        setDriverLoading(false);
      }
    }

    loadDrivers();
  }, []);



  const [searchQuery, setSearchQuery] = useState('');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isEditVehicleModalOpen, setIsEditVehicleModalOpen] = useState(false);
  const [isEditDriverModalOpen, setIsEditDriverModalOpen] = useState(false);
  // const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteVehicleDialogOpen, setIsDeleteVehicleDialogOpen] = useState(false);
  const [isDeleteDriverDialogOpen, setIsDeleteDriverDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

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
    driver_name_local?: string;
    driver_contact: string;
    driver_alternate_mobile?: string;
    driver_license: string;
    address?: string;
  }>({
    driver_name: '',
    driver_name_local: undefined,
    driver_contact: '',
    driver_alternate_mobile: undefined,
    driver_license: '',
    address: undefined,
  });

  // const [assignDriver, setAssignDriver] = useState('');

  // Vehicle handlers
  const handleAddVehicle = async () => {
    try {
      const saved = await createVehicle(vehicleFormData);
      setVehicles(prev => [...prev, saved]);
      setIsVehicleModalOpen(false);
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

    const updated = await updateVehicle(selectedVehicle.vehicle_id, payload);

    setVehicles(prev =>
      prev.map(v => (v.vehicle_id === selectedVehicle.vehicle_id ? updated : v))
    );

    setIsEditVehicleModalOpen(false);
  };


  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;

    await softDeleteVehicle(selectedVehicle.vehicle_id);

    setVehicles(prev =>
      prev.filter(v => v.vehicle_id !== selectedVehicle.vehicle_id)
    );

    setIsDeleteVehicleDialogOpen(false);
  };


  const openEditVehicleModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      vehicle_no: vehicle.vehicle_no,
      vehicle_name: vehicle.vehicle_name,
      model: vehicle.model ?? undefined,
      manufacturing: vehicle.manufacturing ?? undefined,
      color: vehicle.color ?? undefined,
      capacity: vehicle.capacity ?? undefined,
    });
    setIsEditVehicleModalOpen(true);
  };

  const openDeleteVehicleDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteVehicleDialogOpen(true);
  };

  const openAssignModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    // setAssignDriver(vehicle.driverAssigned);
    // setIsAssignModalOpen(true);
  };

  // const handleAssign = () => {
  //   if (selectedVehicle && assignDriver) {
  //     // setVehicles(vehicles.map(v => v.id === selectedVehicle.id ? { ...v, driverAssigned: assignDriver } : v));
  //     setIsAssignModalOpen(false);
  //     setSelectedVehicle(null);
  //     setAssignDriver('');
  //   }
  // };

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
    const payload: CreateDriverDto = {
      driver_name: driverFormData.driver_name,
      driver_name_local: driverFormData.driver_name_local,
      driver_contact: driverFormData.driver_contact,
      driver_alternate_mobile: driverFormData.driver_alternate_mobile,
      driver_license: driverFormData.driver_license,
      address: driverFormData.address,
    };

    const saved = await createDriver(payload);
    setDrivers(prev => [...prev, saved]);
    setIsDriverModalOpen(false);
    resetDriverForm();
  };


  const handleEditDriver = () => {
    if (selectedDriver) {
      setDrivers(drivers.map(d => d.driver_id === selectedDriver.driver_id ? { ...selectedDriver, ...driverFormData } : d));
      setIsEditDriverModalOpen(false);
      setSelectedDriver(null);
      resetDriverForm();
    }
  };

  const handleDeleteDriver = () => {
    if (selectedDriver) {
      setDrivers(drivers.filter(d => d.driver_id !== selectedDriver.driver_id));
      setIsDeleteDriverDialogOpen(false);
      setSelectedDriver(null);
    }
  };

  const openEditDriverModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverFormData({
      driver_name: driver.driver_name,
      driver_name_local: driver.driver_name_local,
      driver_contact: driver.driver_contact,
      driver_alternate_mobile: driver.driver_alternate_mobile,
      driver_license: driver.driver_license,
      address: driver.address
    });
    setIsEditDriverModalOpen(true);
  };

  const openDeleteDriverDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteDriverDialogOpen(true);
  };

  const resetDriverForm = () => {
    setDriverFormData({
      driver_name: '',
      driver_name_local: undefined,
      driver_contact: '',
      driver_alternate_mobile: undefined,
      driver_license: '',
      address: undefined,
    });
  };

  // const getAvailabilityColor = (availability: string) => {
  //   switch (availability) {
  //     case 'Available': return 'bg-green-100 text-green-800';
  //     case 'On Duty': return 'bg-blue-100 text-blue-800';
  //     case 'In Service': return 'bg-yellow-100 text-yellow-800';
  //     case 'On Leave': return 'bg-gray-100 text-gray-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

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
              onClick={() => setIsVehicleModalOpen(true)}
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
                      <tr key={vehicle.vehicle_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
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
                            <button
                              onClick={() => openAssignModal(vehicle)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Assign Driver"
                            >
                              <CarIcon className="w-4 h-4" />
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
              onClick={() => setIsDriverModalOpen(true)}
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
                      <th className="px-4 py-3 text-left text-sm">Driver Name Local</th>
                      <th className="px-4 py-3 text-left text-sm">Contact</th>
                      <th className="px-4 py-3 text-left text-sm">Alternate Contact</th>
                      <th className="px-4 py-3 text-left text-sm">License No</th>
                      <th className="px-4 py-3 text-left text-sm">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((driver, index) => (
                      <tr key={driver.driver_id ?? driver.driver_contact}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-900">
                          {driver.driver_name}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.driver_name_local}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.driver_contact}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.driver_alternate_mobile}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.driver_license}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                          {driver.address}
                        </td>
                        <td className="px-4 py-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditDriverModal(driver)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
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
      <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Add New Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="vehicleNo">Vehicle Number *</Label>
              <Input
                id="vehicleNo"
                value={vehicleFormData.vehicle_no}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_no: e.target.value })}
                placeholder="MH-01-XX-XXXX"
              />
            </div>
            <div>
              <Label htmlFor="vehicleName">Vehicle Name *</Label>
              <Input
                id="vehicleName"
                value={vehicleFormData.vehicle_name}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_name: e.target.value })}
                placeholder="e.g., Toyota Fortuner"
              />
            </div>
            <div>
              <Label htmlFor="vehicleModel">Vehicle Model *</Label>
              <Input
                id="vehicleModel"
                value={vehicleFormData.model ?? ''}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value || undefined })}
                placeholder="e.g., 2024"
              />
            </div>
            <div>
              <Label htmlFor="vehicleManufacturing">Manufacturing *</Label>
              <Input
                id="vehicleManufacturing"
                value={vehicleFormData.manufacturing ?? ''}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, manufacturing: e.target.value || undefined })}
                placeholder="e.g., 2024"
              />
            </div>
            <div>
              <Label htmlFor="vehicleCapacity">Capacity *</Label>
              <Input
                type="number"
                value={vehicleFormData.capacity ?? ''}
                onChange={(e) =>
                  setVehicleFormData({
                    ...vehicleFormData,
                    capacity: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="vehicleColor">Color *</Label>
              <Input
                id="vehicleColor"
                value={vehicleFormData.color ?? ''}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, color: e.target.value || undefined })}
                placeholder="e.g., Red"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsVehicleModalOpen(false); resetVehicleForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddVehicle} className="bg-[#00247D] hover:bg-[#003399] text-white">
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Modal */}
      <Dialog open={isEditVehicleModalOpen} onOpenChange={setIsEditVehicleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Edit Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-vehicleNo">Vehicle Number *</Label>
              <Input
                id="edit-vehicleNo"
                value={vehicleFormData.vehicle_no}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_no: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-vehicleType">Vehicle Name *</Label>
              <Input
                id="edit-vehicleType"
                value={vehicleFormData.vehicle_name}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicle_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-vehicleModel">Vehicle Model *</Label>
              <Input
                id="edit-vehicleModel"
                value={vehicleFormData.model ?? ''}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-vehicleManufacturing">Vehicle Manufacturing *</Label>
              <Input
                id="edit-vehicleManufacturing"
                value={vehicleFormData.manufacturing ?? ''}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, manufacturing: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-vehicleCapacity">Vehicle Capacity *</Label>
              <Input
                type="number"
                id="edit-vehicleCapacity"
                value={vehicleFormData.capacity ?? ''}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, capacity: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
            <div>
              <Label htmlFor="edit-vehicleColor">Color *</Label>
              <Input
                id="edit-vehicleColor"
                value={vehicleFormData.color ?? ''}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, color: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditVehicleModalOpen(false); resetVehicleForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditVehicle} className="bg-[#00247D] hover:bg-[#003399] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Modal
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Assign Driver</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Driver for {selectedVehicle?.vehicle_no}</Label>
            <Select value={assignDriver} onValueChange={setAssignDriver}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.filter(d => d.availability === 'Available').map(driver => (
                  <SelectItem key={driver.id} value={driver.name}>{driver.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} className="bg-[#00247D] hover:bg-[#003399] text-white">
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Add Driver Modal */}
      <Dialog open={isDriverModalOpen} onOpenChange={setIsDriverModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Add New Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="driverName">Full Name *</Label>
              <Input
                id="driverName"
                value={driverFormData.driver_name_local ?? ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, driver_name_local: e.target.value || undefined })}
                placeholder="Enter full name"
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
                value={driverFormData.driver_alternate_mobile ?? ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, driver_alternate_mobile: e.target.value || undefined })}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDriverModalOpen(false); resetDriverForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver} className="bg-[#00247D] hover:bg-[#003399] text-white">
              Add Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Driver Modal */}
      <Dialog open={isEditDriverModalOpen} onOpenChange={setIsEditDriverModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Edit Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                value={driverFormData.driver_name_local ?? ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, driver_name_local: e.target.value || undefined })}
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
                value={driverFormData.driver_alternate_mobile ?? ''}
                onChange={(e) => setDriverFormData({ ...driverFormData, driver_alternate_mobile: e.target.value || undefined })}
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
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDriverModalOpen(false); resetDriverForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditDriver} className="bg-[#00247D] hover:bg-[#003399] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vehicle Confirmation */}
      <AlertDialog open={isDeleteVehicleDialogOpen} onOpenChange={setIsDeleteVehicleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete vehicle <strong>{selectedVehicle?.vehicle_no}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVehicle} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Driver Confirmation */}
      <AlertDialog open={isDeleteDriverDialogOpen} onOpenChange={setIsDeleteDriverDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete driver <strong>{selectedDriver?.driver_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDriver} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
