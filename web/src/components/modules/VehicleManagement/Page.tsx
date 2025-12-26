import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Car as CarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface Vehicle {
  id: string;
  vehicleNo: string;
  vehicleType: string;
  driverAssigned: string;
  availability: 'Available' | 'On Duty' | 'In Service';
}

interface Driver {
  id: string;
  name: string;
  contact: string;
  currentDuty: string;
  availability: 'Available' | 'On Duty' | 'On Leave';
  licenseNo: string;
}

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', vehicleNo: 'MH-01-AB-1234', vehicleType: 'Toyota Fortuner', driverAssigned: 'Ramesh Patil', availability: 'On Duty' },
    { id: '2', vehicleNo: 'MH-01-CD-5678', vehicleType: 'Honda Accord', driverAssigned: 'Sunil Kumar', availability: 'On Duty' },
    { id: '3', vehicleNo: 'MH-01-EF-9012', vehicleType: 'Innova Crysta', driverAssigned: '-', availability: 'Available' },
    { id: '4', vehicleNo: 'MH-01-GH-3456', vehicleType: 'Maruti Ertiga', driverAssigned: 'Vijay Singh', availability: 'Available' }
  ]);

  const [drivers, setDrivers] = useState<Driver[]>([
    { id: '1', name: 'Ramesh Patil', contact: '+91 98765 11111', currentDuty: 'Assigned to Dr. Rajesh Kumar', availability: 'On Duty', licenseNo: 'MH-0120210012345' },
    { id: '2', name: 'Sunil Kumar', contact: '+91 98765 22222', currentDuty: 'Assigned to Mrs. Anita Deshmukh', availability: 'On Duty', licenseNo: 'MH-0120210054321' },
    { id: '3', name: 'Vijay Singh', contact: '+91 98765 33333', currentDuty: '-', availability: 'Available', licenseNo: 'MH-0120210098765' },
    { id: '4', name: 'Prakash Sharma', contact: '+91 98765 44444', currentDuty: '-', availability: 'On Leave', licenseNo: 'MH-0120210011223' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isEditVehicleModalOpen, setIsEditVehicleModalOpen] = useState(false);
  const [isEditDriverModalOpen, setIsEditDriverModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteVehicleDialogOpen, setIsDeleteVehicleDialogOpen] = useState(false);
  const [isDeleteDriverDialogOpen, setIsDeleteDriverDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const [vehicleFormData, setVehicleFormData] = useState({
    vehicleNo: '',
    vehicleType: '',
    driverAssigned: '-',
    availability: 'Available' as Vehicle['availability']
  });

  const [driverFormData, setDriverFormData] = useState({
    name: '',
    contact: '',
    currentDuty: '-',
    availability: 'Available' as Driver['availability'],
    licenseNo: ''
  });

  const [assignDriver, setAssignDriver] = useState('');

  // Vehicle handlers
  const handleAddVehicle = () => {
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      ...vehicleFormData
    };
    setVehicles([...vehicles, newVehicle]);
    setIsVehicleModalOpen(false);
    resetVehicleForm();
  };

  const handleEditVehicle = () => {
    if (selectedVehicle) {
      setVehicles(vehicles.map(v => v.id === selectedVehicle.id ? { ...selectedVehicle, ...vehicleFormData } : v));
      setIsEditVehicleModalOpen(false);
      setSelectedVehicle(null);
      resetVehicleForm();
    }
  };

  const handleDeleteVehicle = () => {
    if (selectedVehicle) {
      setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id));
      setIsDeleteVehicleDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  const openEditVehicleModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      vehicleNo: vehicle.vehicleNo,
      vehicleType: vehicle.vehicleType,
      driverAssigned: vehicle.driverAssigned,
      availability: vehicle.availability
    });
    setIsEditVehicleModalOpen(true);
  };

  const openDeleteVehicleDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteVehicleDialogOpen(true);
  };

  const openAssignModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setAssignDriver(vehicle.driverAssigned);
    setIsAssignModalOpen(true);
  };

  const handleAssign = () => {
    if (selectedVehicle && assignDriver) {
      setVehicles(vehicles.map(v => v.id === selectedVehicle.id ? { ...v, driverAssigned: assignDriver } : v));
      setIsAssignModalOpen(false);
      setSelectedVehicle(null);
      setAssignDriver('');
    }
  };

  const resetVehicleForm = () => {
    setVehicleFormData({
      vehicleNo: '',
      vehicleType: '',
      driverAssigned: '-',
      availability: 'Available'
    });
  };

  // Driver handlers
  const handleAddDriver = () => {
    const newDriver: Driver = {
      id: Date.now().toString(),
      ...driverFormData
    };
    setDrivers([...drivers, newDriver]);
    setIsDriverModalOpen(false);
    resetDriverForm();
  };

  const handleEditDriver = () => {
    if (selectedDriver) {
      setDrivers(drivers.map(d => d.id === selectedDriver.id ? { ...selectedDriver, ...driverFormData } : d));
      setIsEditDriverModalOpen(false);
      setSelectedDriver(null);
      resetDriverForm();
    }
  };

  const handleDeleteDriver = () => {
    if (selectedDriver) {
      setDrivers(drivers.filter(d => d.id !== selectedDriver.id));
      setIsDeleteDriverDialogOpen(false);
      setSelectedDriver(null);
    }
  };

  const openEditDriverModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setDriverFormData({
      name: driver.name,
      contact: driver.contact,
      currentDuty: driver.currentDuty,
      availability: driver.availability,
      licenseNo: driver.licenseNo
    });
    setIsEditDriverModalOpen(true);
  };

  const openDeleteDriverDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteDriverDialogOpen(true);
  };

  const resetDriverForm = () => {
    setDriverFormData({
      name: '',
      contact: '',
      currentDuty: '-',
      availability: 'Available',
      licenseNo: ''
    });
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'On Duty': return 'bg-blue-100 text-blue-800';
      case 'In Service': return 'bg-yellow-100 text-yellow-800';
      case 'On Leave': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.driverAssigned.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.contact.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5A623] text-white">
                    <th className="px-4 py-3 text-left text-sm">Vehicle No</th>
                    <th className="px-4 py-3 text-left text-sm">Vehicle Type</th>
                    <th className="px-4 py-3 text-left text-sm">Driver Assigned</th>
                    <th className="px-4 py-3 text-left text-sm">Availability</th>
                    <th className="px-4 py-3 text-left text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle, index) => (
                    <tr key={vehicle.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-900">
                        {vehicle.vehicleNo}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                        {vehicle.vehicleType}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                        {vehicle.driverAssigned}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200">
                        <span className={`inline-block px-2 py-1 rounded-sm text-xs ${getAvailabilityColor(vehicle.availability)}`}>
                          {vehicle.availability}
                        </span>
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
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5A623] text-white">
                    <th className="px-4 py-3 text-left text-sm">Name</th>
                    <th className="px-4 py-3 text-left text-sm">Contact</th>
                    <th className="px-4 py-3 text-left text-sm">License No</th>
                    <th className="px-4 py-3 text-left text-sm">Current Duty</th>
                    <th className="px-4 py-3 text-left text-sm">Availability</th>
                    <th className="px-4 py-3 text-left text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver, index) => (
                    <tr key={driver.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-900">
                        {driver.name}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                        {driver.contact}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                        {driver.licenseNo}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                        {driver.currentDuty}
                      </td>
                      <td className="px-4 py-3 border-t border-gray-200">
                        <span className={`inline-block px-2 py-1 rounded-sm text-xs ${getAvailabilityColor(driver.availability)}`}>
                          {driver.availability}
                        </span>
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
                value={vehicleFormData.vehicleNo}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicleNo: e.target.value })}
                placeholder="MH-01-XX-XXXX"
              />
            </div>
            <div>
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Input
                id="vehicleType"
                value={vehicleFormData.vehicleType}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicleType: e.target.value })}
                placeholder="e.g., Toyota Fortuner"
              />
            </div>
            <div>
              <Label htmlFor="availability">Availability</Label>
              <Select value={vehicleFormData.availability} onValueChange={(value: any) => setVehicleFormData({ ...vehicleFormData, availability: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="On Duty">On Duty</SelectItem>
                  <SelectItem value="In Service">In Service</SelectItem>
                </SelectContent>
              </Select>
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
                value={vehicleFormData.vehicleNo}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicleNo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-vehicleType">Vehicle Type *</Label>
              <Input
                id="edit-vehicleType"
                value={vehicleFormData.vehicleType}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicleType: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-availability">Availability</Label>
              <Select value={vehicleFormData.availability} onValueChange={(value: any) => setVehicleFormData({ ...vehicleFormData, availability: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="On Duty">On Duty</SelectItem>
                  <SelectItem value="In Service">In Service</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Assign Driver Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Assign Driver</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Driver for {selectedVehicle?.vehicleNo}</Label>
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
      </Dialog>

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
                value={driverFormData.name}
                onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="driverContact">Contact Number *</Label>
              <Input
                id="driverContact"
                value={driverFormData.contact}
                onChange={(e) => setDriverFormData({ ...driverFormData, contact: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <Label htmlFor="licenseNo">License Number *</Label>
              <Input
                id="licenseNo"
                value={driverFormData.licenseNo}
                onChange={(e) => setDriverFormData({ ...driverFormData, licenseNo: e.target.value })}
                placeholder="MH-XXXXXXXXXXXX"
              />
            </div>
            <div>
              <Label htmlFor="driverAvailability">Availability</Label>
              <Select value={driverFormData.availability} onValueChange={(value: any) => setDriverFormData({ ...driverFormData, availability: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="On Duty">On Duty</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
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
                value={driverFormData.name}
                onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-driverContact">Contact Number *</Label>
              <Input
                id="edit-driverContact"
                value={driverFormData.contact}
                onChange={(e) => setDriverFormData({ ...driverFormData, contact: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-licenseNo">License Number *</Label>
              <Input
                id="edit-licenseNo"
                value={driverFormData.licenseNo}
                onChange={(e) => setDriverFormData({ ...driverFormData, licenseNo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-driverAvailability">Availability</Label>
              <Select value={driverFormData.availability} onValueChange={(value: any) => setDriverFormData({ ...driverFormData, availability: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="On Duty">On Duty</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
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
              Are you sure you want to delete vehicle <strong>{selectedVehicle?.vehicleNo}</strong>? This action cannot be undone.
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
              Are you sure you want to delete driver <strong>{selectedDriver?.name}</strong>? This action cannot be undone.
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
