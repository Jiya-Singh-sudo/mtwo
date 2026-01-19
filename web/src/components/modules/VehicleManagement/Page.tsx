import { useEffect, useState } from 'react';
import { Edit, Trash2, Eye, Plus, Search } from 'lucide-react';
import { Car, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { getVehiclesTable, createVehicle, updateVehicle, softDeleteVehicle } from '../../../api/vehicles.api';
import { getDriversTable, createDriver, softDeleteDriver } from '../../../api/driver.api';
import { VehicleUpdateDto } from '../../../types/vehicles';
import { CreateDriverDto } from '../../../types/drivers';
import { useTableQuery } from '@/hooks/useTableQuery';
import { Column, DataTable } from '@/components/ui/DataTable';

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
  // useEffect(() => {
  //   async function loadDrivers() {
  //     try {
  //       const data = await fetchDrivers();

  //       const normalized = data.map((d: any) => ({
  //         driver_id: d.driver_id,
  //         driver_name: d.driver_name,
  //         driver_name_ll: d.driver_name_local_language,
  //         driver_contact: d.driver_contact,
  //         driver_alternate_contact: d.driver_alternate_mobile,
  //         driver_license: d.driver_license,
  //         address: d.address,
  //         is_active: d.is_active,
  //         inserted_at: d.inserted_at,
  //       }));

  //       setDrivers(normalized);
  //     } catch (err) {
  //       console.error('Failed to load driver', err);
  //     } finally {
  //       setDriverLoading(false);
  //     }
  //   }

  //   loadDrivers();
  // }, []);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [activeTab, setActiveTab] = useState<"vehicles" | "drivers">("vehicles");

  // Vehicle modals
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [showDeleteVehicleConfirm, setShowDeleteVehicleConfirm] = useState(false);
  const [viewVehicle, setViewVehicle] = useState<Vehicle | null>(null);

  // Driver modals
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showEditDriver, setShowEditDriver] = useState(false);
  const [showDeleteDriverConfirm, setShowDeleteDriverConfirm] = useState(false);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);

  const vehicleTable = useTableQuery({
    prefix: "vehicles",
    sortBy: 'vehicle_name',
    sortOrder: 'asc',
    limit: 10,
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const driverTable = useTableQuery({
    prefix: "drivers",
    sortBy: 'driver_name',
    sortOrder: 'asc',
    limit: 10,
  });

  const [drivers, setDrivers] = useState<Driver[]>([]);


  useEffect(() => {
    async function load() {
      vehicleTable.setLoading(true);
      try {
        const res = await getVehiclesTable(vehicleTable.query);
        setVehicles(res.data);
        vehicleTable.setTotal(res.totalCount);
      } finally {
        vehicleTable.setLoading(false);
      }
    }

    load();
  }, [vehicleTable.query]);

  useEffect(() => {
    async function load() {
      driverTable.setLoading(true);
      try {
        const res = await getDriversTable(driverTable.query);
        setDrivers(res.data);
        driverTable.setTotal(res.totalCount);
      } finally {
        driverTable.setLoading(false);
      }
    }

    load();
  }, [driverTable.query]);

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
      await createVehicle(vehicleFormData);
      vehicleTable.setPage(1);
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

    vehicleTable.setPage(1);

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

      await createDriver(payload);
      driverTable.setPage(1);
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
    driverTable.setPage(1);
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

  // const filteredVehicles = vehicles
  //   .filter(v =>
  //     vehicleFilter === "ALL" ? true : v.is_active
  //   )
  //   .filter(v =>
  //     v.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     v.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase())
  //   );

  // const filteredDrivers = drivers
  //   .filter(d =>
  //     driverFilter === "ALL" ? true : d.is_active
  //   )
  //   .filter(driver =>
  //     driver.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     driver.driver_contact.toLowerCase().includes(searchQuery.toLowerCase())
  //   );

  const vehicleColumns: Column<Vehicle>[] = [
    {
      header: 'Vehicle No',
      accessor: 'vehicle_no',
      sortable: true,
      sortKey: 'vehicle_no',
    },
    {
      header: 'Vehicle Name',
      accessor: 'vehicle_name',
      sortable: true,
      sortKey: 'vehicle_name',
    },
    {
      header: 'Model',
      accessor: 'model',
    },
    {
      header: 'Manufacturing',
      accessor: 'manufacturing',
      sortable: true,
      sortKey: 'manufacturing',
    },
    {
      header: 'Capacity',
      accessor: 'capacity',
    },
    {
      header: 'Actions',
      render: (row: Vehicle) => (
        <div className="flex items-center gap-3">
          {/* View */}
          <button
            className="icon-btn text-blue-600"
            title="View"
            onClick={() => setViewVehicle(row)}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit */}
          <button
            className="icon-btn text-green-600"
            title="Edit"
            onClick={() => openEditVehicleModal(row)}
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            className="icon-btn text-red-600"
            title="Delete"
            onClick={() => openDeleteVehicleDialog(row)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const driverColumns: Column<Driver>[] = [
    {
      header: 'Driver Name',
      accessor: 'driver_name',
      sortable: true,
      sortKey: 'driver_name',
    },
    {
      header: 'Name (Local)',
      accessor: 'driver_name_ll',
    },
    {
      header: 'Contact',
      accessor: 'driver_contact',
      sortable: true,
      sortKey: 'driver_contact',
    },
    {
      header: 'License',
      accessor: 'driver_license',
      sortable: true,
      sortKey: 'driver_license',
    },
    {
      header: 'Address',
      accessor: 'address',
    },
    {
      header: 'Actions',
      render: (row: Driver) => (
        <div className="flex items-center gap-3">
          {/* View */}
          <button
            className="icon-btn text-blue-600"
            title="View"
            onClick={() => setViewDriver(row)}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit */}
          <button
            className="icon-btn text-green-600"
            title="Edit"
            onClick={() => openEditDriverModal(row)}
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            className="icon-btn text-red-600"
            title="Delete"
            onClick={() => openDeleteDriverDialog(row)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-[#00247D]">Vehicle & Driver Management</h2>
        <p className="text-gray-600 text-sm mt-1">Manage vehicles and drivers | वाहन और चालक प्रबंधन</p>
      </div>
      {/* STATS */}
      <div className="statsGrid">
        <div
          className="statCard blue"
          onClick={() => { vehicleTable.setPage(1); vehicleTable.setSort('vehicle_name', 'asc'); }}
        >
          <Car />
          <div>
            <p>Total Vehicles</p>
            <h3>{vehicleTable.total}</h3>
          </div>
        </div>

        <div
          className="statCard green"
          onClick={() => { vehicleTable.setPage(1); }}
        >
          <CheckCircle />
          <div>
            <p>Active Vehicles</p>
            <h3>{vehicles.filter(v => v.is_active).length}</h3>
          </div>
        </div>

        <div
          className="statCard orange"
          onClick={() => {
            driverTable.setPage(1);
            driverTable.setSort('driver_name', 'asc');
          }}
        >
          <Users />
          <div>
            <p>Total Drivers</p>
            <h3>{driverTable.total}</h3>
          </div>
        </div>

        <div
          className="statCard purple"
          onClick={() => {
            driverTable.setPage(1);
          }}
        >
          <AlertCircle />
          <div>
            <p>Active Drivers</p>
            <h3>-</h3>
          </div>
        </div>
      </div>
      {/* TABS */}
      <div className="nicTabs">
        <button
          className={`nicTab ${activeTab === "vehicles" ? "active" : ""}`}
          onClick={() => setActiveTab("vehicles")}
        >
          Vehicles
        </button>
        <button
          className={`nicTab ${activeTab === "drivers" ? "active" : ""}`}
          onClick={() => setActiveTab("drivers")}
        >
          Drivers
        </button>
      </div>

      {/* VEHICLES TAB */}
      {activeTab === "vehicles" && (
        <>
          <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                placeholder="Search vehicle no or name…"
                value={vehicleTable.searchInput}
                onChange={(e) => vehicleTable.setSearchInput(e.target.value)}
              />
            </div>

            <Button
              className="bg-[#00247D] text-white btn-icon-text"
              onClick={() => setShowAddVehicle(true)}
            >
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Button>
          </div>
          {/* Vehicle List Table */}
          <DataTable
            data={vehicles}
            columns={vehicleColumns}
            keyField="vehicle_no"

            page={vehicleTable.query.page}
            limit={vehicleTable.query.limit}
            totalCount={vehicleTable.total}

            sortBy={vehicleTable.query.sortBy}
            sortOrder={vehicleTable.query.sortOrder}
            loading={vehicleTable.loading}

            onPageChange={vehicleTable.setPage}
            onLimitChange={vehicleTable.setLimit}
            onSortChange={vehicleTable.setSort}
          />

        </>
      )}

      {/* DRIVERS TAB */}
      {activeTab === "drivers" && (
        <>
          <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                placeholder="Search name, contact or license…"
                value={driverTable.searchInput}
                onChange={(e) => driverTable.setSearchInput(e.target.value)}
              />
            </div>

            <Button
              className="bg-[#00247D] text-white btn-icon-text"
              onClick={() => setShowAddDriver(true)}
            >
              <Plus className="w-4 h-4" />
              Add Driver
            </Button>
          </div>

          {/* Driver List Table */}
          <DataTable
            data={drivers}
            columns={driverColumns}
            keyField="driver_id"

            page={driverTable.query.page}
            limit={driverTable.query.limit}
            totalCount={driverTable.total}

            sortBy={driverTable.query.sortBy}
            sortOrder={driverTable.query.sortOrder}
            loading={driverTable.loading}

            onPageChange={driverTable.setPage}
            onLimitChange={driverTable.setLimit}
            onSortChange={driverTable.setSort}
          />
        </>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="modalOverlay">
          <div className="nicModal">

            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Add Vehicle</h2>
              <button
                className="closeBtn"
                onClick={() => {
                  setShowAddVehicle(false);
                  resetVehicleForm();
                }}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="nicModalBody">
              <div className="nicFormGrid">

                <div>
                  <label className="nicLabel">
                    Vehicle Number <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.vehicle_no}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, vehicle_no: e.target.value })
                    }
                    placeholder="MH-01-XX-XXXX"
                  />
                </div>

                <div>
                  <label className="nicLabel">
                    Vehicle Name <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.vehicle_name}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, vehicle_name: e.target.value })
                    }
                    placeholder="e.g., Toyota Fortuner"
                  />
                </div>

                <div>
                  <label className="nicLabel">Model</label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.model ?? ""}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, model: e.target.value || undefined })
                    }
                    placeholder="e.g., ZX"
                  />
                </div>

                <div>
                  <label className="nicLabel">Manufacturing Year</label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.manufacturing ?? ""}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, manufacturing: e.target.value || undefined })
                    }
                    placeholder="e.g., 2024"
                  />
                </div>

                <div>
                  <label className="nicLabel">Capacity</label>
                  <input
                    type="number"
                    className="nicInput"
                    value={vehicleFormData.capacity ?? ""}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        capacity: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="nicLabel">Color</label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.color ?? ""}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, color: e.target.value || undefined })
                    }
                    placeholder="e.g., White"
                  />
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {
                  setShowAddVehicle(false);
                  resetVehicleForm();
                }}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={handleAddVehicle}>
                Add Vehicle
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditVehicle && selectedVehicle && (
        <div className="modalOverlay">
          <div className="nicModal">

            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Edit Vehicle</h2>
              <button
                className="closeBtn"
                onClick={() => {
                  setShowEditVehicle(false);
                  resetVehicleForm();
                }}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="nicModalBody">
              <div className="nicFormGrid">

                <div>
                  <label className="nicLabel">
                    Vehicle Number <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput bg-gray-100"
                    value={vehicleFormData.vehicle_no}
                    disabled
                  />
                </div>

                <div>
                  <label className="nicLabel">
                    Vehicle Name <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.vehicle_name}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, vehicle_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">Model</label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.model ?? ""}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, model: e.target.value || undefined })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">Manufacturing Year</label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.manufacturing ?? ""}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, manufacturing: e.target.value || undefined })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">Capacity</label>
                  <input
                    type="number"
                    className="nicInput"
                    value={vehicleFormData.capacity ?? ""}
                    onChange={(e) =>
                      setVehicleFormData({
                        ...vehicleFormData,
                        capacity: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">Color</label>
                  <input
                    className="nicInput"
                    value={vehicleFormData.color ?? ""}
                    onChange={(e) =>
                      setVehicleFormData({ ...vehicleFormData, color: e.target.value || undefined })
                    }
                  />
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {
                  setShowEditVehicle(false);
                  resetVehicleForm();
                }}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={handleEditVehicle}>
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddDriver && (
        <div className="modalOverlay">
          <div className="nicModal">

            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Add Driver</h2>
              <button
                className="closeBtn"
                onClick={() => {
                  setShowAddDriver(false);
                  resetDriverForm();
                }}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="nicModalBody">
              <div className="nicFormGrid">

                <div>
                  <label className="nicLabel">
                    Full Name <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_name}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_name: e.target.value })
                    }
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="nicLabel">Full Name (Local)</label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_name_ll ?? ""}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_name_ll: e.target.value || undefined })
                    }
                    placeholder="Enter full name in local language"
                  />
                </div>

                <div>
                  <label className="nicLabel">
                    Contact Number <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_contact}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_contact: e.target.value })
                    }
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label className="nicLabel">Alternate Contact Number</label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_alternate_contact ?? ""}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_alternate_contact: e.target.value || undefined })
                    }
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label className="nicLabel">
                    License Number <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_license}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_license: e.target.value })
                    }
                    placeholder="MH-XXXXXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="nicLabel">Address</label>
                  <input
                    className="nicInput"
                    value={driverFormData.address ?? ""}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, address: e.target.value || undefined })
                    }
                    placeholder="Enter address"
                  />
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {
                  setShowAddDriver(false);
                  resetDriverForm();
                }}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={handleAddDriver}>
                Add Driver
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditDriver && selectedDriver && (
        <div className="modalOverlay">
          <div className="nicModal">

            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Edit Driver</h2>
              <button
                className="closeBtn"
                onClick={() => {
                  setShowEditDriver(false);
                  resetDriverForm();
                }}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="nicModalBody">
              <div className="nicFormGrid">

                <div>
                  <label className="nicLabel">
                    Full Name <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_name}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">Full Name (Local)</label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_name_ll ?? ""}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_name_ll: e.target.value || undefined })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">
                    Contact Number <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_contact}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_contact: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">Alternate Contact Number</label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_alternate_contact ?? ""}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_alternate_contact: e.target.value || undefined })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">
                    License Number <span className="nicRequired">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={driverFormData.driver_license}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, driver_license: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="nicLabel">Address</label>
                  <input
                    className="nicInput"
                    value={driverFormData.address ?? ""}
                    onChange={(e) =>
                      setDriverFormData({ ...driverFormData, address: e.target.value || undefined })
                    }
                  />
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {
                  setShowEditDriver(false);
                  resetDriverForm();
                }}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={handleEditDriver}>
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

      {/* View Vehicle Modal */}
      {viewVehicle && (
        <div className="modalOverlay">
          <div className="nicModal wide">

            <div className="nicModalHeader">
              <h2>Vehicle Details</h2>
              <button className="closeBtn" onClick={() => setViewVehicle(null)}>
                ✕
              </button>
            </div>

            <div className="nicModalBody">
              <div className="detailGridHorizontal">

                <div className="detailSection">
                  <h4>Vehicle Information</h4>
                  <p><b>Vehicle No:</b> {viewVehicle.vehicle_no}</p>
                  <p><b>Name:</b> {viewVehicle.vehicle_name}</p>
                  <p><b>Status:</b> {viewVehicle.is_active ? "Active" : "Inactive"}</p>
                </div>

                <div className="detailSection">
                  <h4>Specifications</h4>
                  <p><b>Model:</b> {viewVehicle.model || "—"}</p>
                  <p><b>Manufacturing Year:</b> {viewVehicle.manufacturing || "—"}</p>
                  <p><b>Capacity:</b> {viewVehicle.capacity || "—"}</p>
                  <p><b>Color:</b> {viewVehicle.color || "—"}</p>
                </div>

              </div>
            </div>

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setViewVehicle(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* View Driver Modal */}
      {viewDriver && (
        <div className="modalOverlay">
          <div className="nicModal wide">

            <div className="nicModalHeader">
              <h2>Driver Details</h2>
              <button className="closeBtn" onClick={() => setViewDriver(null)}>
                ✕
              </button>
            </div>

            <div className="nicModalBody">
              <div className="detailGridHorizontal">

                <div className="detailSection">
                  <h4>Driver Information</h4>
                  <p><b>Name:</b> {viewDriver.driver_name}</p>
                  <p><b>Name (Local):</b> {viewDriver.driver_name_ll || "—"}</p>
                  <p><b>Status:</b> {viewDriver.is_active ? "Active" : "Inactive"}</p>
                </div>

                <div className="detailSection">
                  <h4>Contact Details</h4>
                  <p><b>Contact:</b> {viewDriver.driver_contact}</p>
                  <p><b>Alternate Contact:</b> {viewDriver.driver_alternate_contact || "—"}</p>
                  <p><b>License No:</b> {viewDriver.driver_license}</p>
                  <p><b>Address:</b> {viewDriver.address || "—"}</p>
                </div>

              </div>
            </div>

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setViewDriver(null)}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}