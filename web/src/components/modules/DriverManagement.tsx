import {
  User,
  Clock,
  Calendar,
  Phone,
  Shield,
} from "lucide-react";

export function DriverManagement() {
  const drivers = [
    {
      id: "D001",
      name: "Ram Singh",
      license: "DL-1420110012345",
      phone: "+91-98765-43210",
      shift: "Day Shift",
      status: "On Duty",
      vehicle: "DL-01-AB-1234",
      assignedTo: "Shri Rajesh Kumar",
      experience: "15 years",
      rating: "4.8/5",
    },
    {
      id: "D002",
      name: "Mohan Kumar",
      license: "DL-1420110054321",
      phone: "+91-98765-12345",
      shift: "Day Shift",
      status: "On Duty",
      vehicle: "DL-01-CD-5678",
      assignedTo: "Shri Amit Verma",
      experience: "12 years",
      rating: "4.6/5",
    },
    {
      id: "D003",
      name: "Suresh Yadav",
      license: "DL-1420110098765",
      phone: "+91-98765-67890",
      shift: "Day Shift",
      status: "Available",
      vehicle: null,
      assignedTo: null,
      experience: "10 years",
      rating: "4.7/5",
    },
    {
      id: "D004",
      name: "Rakesh Sharma",
      license: "DL-1420110087654",
      phone: "+91-98765-11111",
      shift: "Night Shift",
      status: "On Duty",
      vehicle: "DL-01-XY-7890",
      assignedTo: "VVIP Standby",
      experience: "18 years",
      rating: "4.9/5",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">
            Driver Management Dashboard
          </h2>
          <p className="text-sm text-gray-600">
            चालक प्रबंधन - Manage drivers, shifts, and
            assignments
          </p>
        </div>
        <button className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors">
          Add New Driver
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-green-200 rounded-sm p-6">
          <p className="text-sm text-gray-600">
            Available Drivers
          </p>
          <p className="text-3xl text-green-600 mt-2">8</p>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-sm p-6">
          <p className="text-sm text-gray-600">On Duty</p>
          <p className="text-3xl text-blue-600 mt-2">12</p>
        </div>
        <div className="bg-white border-2 border-purple-200 rounded-sm p-6">
          <p className="text-sm text-gray-600">Night Shift</p>
          <p className="text-3xl text-purple-600 mt-2">5</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-sm p-6">
          <p className="text-sm text-gray-600">Total Drivers</p>
          <p className="text-3xl text-gray-700 mt-2">25</p>
        </div>
      </div>

      {/* Driver List */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Driver List</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="border border-gray-200 rounded-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-16 h-16 ${
                      driver.status === "Available"
                        ? "bg-green-100"
                        : driver.status === "On Duty"
                          ? "bg-blue-100"
                          : "bg-purple-100"
                    } rounded-sm flex items-center justify-center`}
                  >
                    <User
                      className={`w-8 h-8 ${
                        driver.status === "Available"
                          ? "text-green-600"
                          : driver.status === "On Duty"
                            ? "text-blue-600"
                            : "text-purple-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="text-gray-900">
                      {driver.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {driver.id}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    driver.status === "Available"
                      ? "bg-green-100 text-green-700"
                      : driver.status === "On Duty"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {driver.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Shield className="w-4 h-4" />
                  <span>License: {driver.license}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>{driver.shift}</span>
                </div>
                {driver.vehicle && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>Vehicle: {driver.vehicle}</span>
                  </div>
                )}
                {driver.assignedTo && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>Assigned: {driver.assignedTo}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-600">
                    Experience: {driver.experience}
                  </span>
                  <span className="text-xs text-gray-600">
                    Rating: {driver.rating}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2 text-sm text-blue-600 border border-blue-600 rounded-sm hover:bg-blue-50">
                  Edit Details
                </button>
                <button className="flex-1 py-2 text-sm text-green-600 border border-green-600 rounded-sm hover:bg-green-50">
                  Assign Vehicle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shift Schedule */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">
            Today's Shift Schedule
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#F5A623] to-[#E09612] border-b border-[#D4951C]">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Driver Name
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Shift Time
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">Ram Singh</td>
                <td className="px-6 py-4 text-sm">
                  08:00 - 20:00
                </td>
                <td className="px-6 py-4 text-sm">
                  DL-01-AB-1234
                </td>
                <td className="px-6 py-4 text-sm">
                  Shri Rajesh Kumar
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  Mohan Kumar
                </td>
                <td className="px-6 py-4 text-sm">
                  08:00 - 20:00
                </td>
                <td className="px-6 py-4 text-sm">
                  DL-01-CD-5678
                </td>
                <td className="px-6 py-4 text-sm">
                  Shri Amit Verma
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Active
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  Rakesh Sharma
                </td>
                <td className="px-6 py-4 text-sm">
                  20:00 - 08:00
                </td>
                <td className="px-6 py-4 text-sm">
                  DL-01-XY-7890
                </td>
                <td className="px-6 py-4 text-sm">
                  VVIP Standby
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    Night Duty
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}