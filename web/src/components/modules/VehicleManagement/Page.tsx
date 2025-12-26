import { useState } from 'react';
import { Car, User, MapPin } from 'lucide-react';

interface Vehicle {
  id: string;
  number: string;
  type: string;
  status: string;
  driver: string | null;
  assignedTo: string | null;
  location: string;
}

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'V001',
      number: 'DL-01-AB-1234',
      type: 'Toyota Innova',
      status: 'On Duty',
      driver: 'Ram Singh',
      assignedTo: 'Shri Rajesh Kumar',
      location: 'Guest House',
    },
    {
      id: 'V002',
      number: 'DL-01-CD-5678',
      type: 'Honda City',
      status: 'On Duty',
      driver: 'Mohan Kumar',
      assignedTo: 'Shri Amit Verma',
      location: 'Ministry',
    },
    {
      id: 'V003',
      number: 'DL-01-EF-9012',
      type: 'Toyota Fortuner',
      status: 'Available',
      driver: 'Suresh Yadav',
      assignedTo: null,
      location: 'Parking',
    },
    {
      id: 'V004',
      number: 'DL-01-GH-3456',
      type: 'Maruti Ertiga',
      status: 'In Service',
      driver: null,
      assignedTo: null,
      location: 'Service Center',
    },
  ]);

  const drivers = [
    { name: 'Ram Singh', status: 'On Duty', vehicle: 'DL-01-AB-1234', shift: 'Day' },
    { name: 'Mohan Kumar', status: 'On Duty', vehicle: 'DL-01-CD-5678', shift: 'Day' },
    { name: 'Suresh Yadav', status: 'Free', vehicle: null, shift: 'Day' },
    { name: 'Rakesh Sharma', status: 'Night Duty', vehicle: 'DL-01-XY-7890', shift: 'Night' },
  ];

  const assignVehicleToGuest = (vehicleId: string) => {
    const guest = prompt('Enter Guest Name');
    if (!guest) return;

    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId
          ? {
            ...v,
            assignedTo: guest,
            status: 'On Duty',
            location: 'Guest House',
          }
          : v
      )
    );
  };

  const viewVehicle = (vehicle: any) => {
    alert(
      `Vehicle: ${vehicle.number}
Type: ${vehicle.type}
Driver: ${vehicle.driver || 'Not Assigned'}
Guest: ${vehicle.assignedTo || 'None'}
Status: ${vehicle.status}
Location: ${vehicle.location}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Vehicle & Driver Management</h2>
          <p className="text-sm text-gray-600">वाहन और चालक प्रबंधन</p>
        </div>
        <button
          onClick={() => {
            const available = vehicles.find(v => v.status === 'Available');
            if (!available) {
              alert('No available vehicles');
              return;
            }
            assignVehicleToGuest(available.id);
          }}
          className="px-6 py-3 bg-[#00247D] text-white rounded-sm"
        >
          Assign Vehicle to Guest
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Vehicle Fleet</h3>
          </div>

          <div className="p-6 space-y-4">
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="border border-gray-200 rounded-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="text-gray-900">{vehicle.number}</p>
                    <p className="text-sm text-gray-600">{vehicle.type}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100">
                    {vehicle.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {vehicle.driver && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Driver: {vehicle.driver}
                    </div>
                  )}
                  {vehicle.assignedTo && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Guest: {vehicle.assignedTo}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {vehicle.location}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => viewVehicle(vehicle)}
                    className="text-sm text-blue-700 underline"
                  >
                    View
                  </button>

                  {vehicle.status === 'Available' && (
                    <button
                      onClick={() => assignVehicleToGuest(vehicle.id)}
                      className="text-sm px-3 py-1 bg-green-600 text-white rounded-sm"
                    >
                      Assign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Driver Status</h3>
          </div>

          <div className="p-6 space-y-4">
            {drivers.map((driver, index) => (
              <div key={index} className="border border-gray-200 rounded-sm p-4">
                <p className="text-gray-900">{driver.name}</p>
                <p className="text-sm text-gray-600">
                  {driver.shift} Shift — {driver.status}
                </p>
                {driver.vehicle && (
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <Car className="w-4 h-4" />
                    {driver.vehicle}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}