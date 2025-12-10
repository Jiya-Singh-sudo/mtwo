import { Car, User, MapPin } from 'lucide-react';

export function VehicleManagement() {
  const vehicles = [
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
  ];

  const drivers = [
    { name: 'Ram Singh', status: 'On Duty', vehicle: 'DL-01-AB-1234', shift: 'Day' },
    { name: 'Mohan Kumar', status: 'On Duty', vehicle: 'DL-01-CD-5678', shift: 'Day' },
    { name: 'Suresh Yadav', status: 'Free', vehicle: null, shift: 'Day' },
    { name: 'Rakesh Sharma', status: 'Night Duty', vehicle: 'DL-01-XY-7890', shift: 'Night' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Vehicle & Driver Management</h2>
          <p className="text-sm text-gray-600">वाहन और चालक प्रबंधन - Manage fleet and assignments</p>
        </div>
        <button className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors">
          Assign Vehicle to Guest
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-green-200 rounded-sm p-6">
          <p className="text-sm text-gray-600">Available Vehicles</p>
          <p className="text-3xl text-green-600 mt-2">8</p>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-sm p-6">
          <p className="text-sm text-gray-600">On Duty</p>
          <p className="text-3xl text-blue-600 mt-2">5</p>
        </div>
        <div className="bg-white border-2 border-yellow-200 rounded-sm p-6">
          <p className="text-sm text-gray-600">In Service</p>
          <p className="text-3xl text-yellow-600 mt-2">2</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-sm p-6">
          <p className="text-sm text-gray-600">Total Fleet</p>
          <p className="text-3xl text-gray-700 mt-2">15</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle List */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Vehicle Fleet</h3>
          </div>
          <div className="p-6 space-y-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="border border-gray-200 rounded-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${vehicle.status === 'Available' ? 'bg-green-100' :
                        vehicle.status === 'On Duty' ? 'bg-blue-100' :
                          'bg-yellow-100'
                      } rounded-sm flex items-center justify-center`}>
                      <Car className={`w-6 h-6 ${vehicle.status === 'Available' ? 'text-green-600' :
                          vehicle.status === 'On Duty' ? 'text-blue-600' :
                            'text-yellow-600'
                        }`} />
                    </div>
                    <div>
                      <p className="text-gray-900">{vehicle.number}</p>
                      <p className="text-sm text-gray-600">{vehicle.type}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${vehicle.status === 'Available' ? 'bg-green-100 text-green-700' :
                      vehicle.status === 'On Duty' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {vehicle.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {vehicle.driver && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span>Driver: {vehicle.driver}</span>
                    </div>
                  )}
                  {vehicle.assignedTo && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span>Assigned to: {vehicle.assignedTo}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span>Location: {vehicle.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver List */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Driver Status</h3>
          </div>
          <div className="p-6 space-y-4">
            {drivers.map((driver, index) => (
              <div key={index} className="border border-gray-200 rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${driver.status === 'Free' ? 'bg-green-100' :
                        driver.status === 'On Duty' ? 'bg-blue-100' :
                          'bg-purple-100'
                      } rounded-sm flex items-center justify-center`}>
                      <User className={`w-6 h-6 ${driver.status === 'Free' ? 'text-green-600' :
                          driver.status === 'On Duty' ? 'text-blue-600' :
                            'text-purple-600'
                        }`} />
                    </div>
                    <div>
                      <p className="text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-600">{driver.shift} Shift</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${driver.status === 'Free' ? 'bg-green-100 text-green-700' :
                      driver.status === 'On Duty' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                    }`}>
                    {driver.status}
                  </span>
                </div>

                {driver.vehicle && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Car className="w-4 h-4" />
                    <span>Vehicle: {driver.vehicle}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Today's Vehicle Allocation Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Time</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Vehicle</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Driver</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Guest</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Route</th>
                <th className="px-6 py-3 text-left text-sm text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">09:00 AM</td>
                <td className="px-6 py-4 text-sm">DL-01-AB-1234</td>
                <td className="px-6 py-4 text-sm">Ram Singh</td>
                <td className="px-6 py-4 text-sm">Shri Rajesh Kumar</td>
                <td className="px-6 py-4 text-sm">Guest House → Ministry of Defence</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">In Progress</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">11:30 AM</td>
                <td className="px-6 py-4 text-sm">DL-01-CD-5678</td>
                <td className="px-6 py-4 text-sm">Mohan Kumar</td>
                <td className="px-6 py-4 text-sm">Shri Amit Verma</td>
                <td className="px-6 py-4 text-sm">Ministry of Finance → Airport</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Scheduled</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">02:00 PM</td>
                <td className="px-6 py-4 text-sm">DL-01-EF-9012</td>
                <td className="px-6 py-4 text-sm">Suresh Yadav</td>
                <td className="px-6 py-4 text-sm">Dr. Priya Sharma</td>
                <td className="px-6 py-4 text-sm">Airport → Guest House</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">Scheduled</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
