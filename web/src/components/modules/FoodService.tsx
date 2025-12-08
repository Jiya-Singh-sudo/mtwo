import { UtensilsCrossed, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

export function FoodService() {
  const mealSchedule = [
    {
      meal: 'Breakfast',
      time: '07:00 - 10:00',
      guests: 28,
      menu: 'Poha, Idli, Toast, Fruits, Tea/Coffee',
      status: 'Completed',
      specialRequests: 2
    },
    {
      meal: 'Lunch',
      time: '12:30 - 15:00',
      guests: 32,
      menu: 'Dal, Roti, Rice, Sabzi, Salad, Curd',
      status: 'In Progress',
      specialRequests: 5
    },
    {
      meal: 'Evening Tea',
      time: '16:00 - 17:00',
      guests: 25,
      menu: 'Tea, Coffee, Samosa, Biscuits',
      status: 'Upcoming',
      specialRequests: 1
    },
    {
      meal: 'Dinner',
      time: '19:30 - 22:00',
      guests: 30,
      menu: 'Dal, Roti, Rice, Paneer, Mix Veg, Dessert',
      status: 'Upcoming',
      specialRequests: 3
    },
  ];

  const specialRequests = [
    { guest: 'Shri Rajesh Kumar', requirement: 'Jain food (no onion, garlic)', meal: 'All meals', status: 'Active' },
    { guest: 'Dr. Priya Sharma', requirement: 'Vegetarian only', meal: 'All meals', status: 'Active' },
    { guest: 'Shri Amit Verma', requirement: 'Low sugar diet', meal: 'All meals', status: 'Active' },
    { guest: 'Mrs. Sunita Singh', requirement: 'Gluten-free', meal: 'Breakfast & Dinner', status: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Food Service Dashboard</h2>
          <p className="text-sm text-gray-600">खाद्य सेवा - Manage meals, menus, and dietary requirements</p>
        </div>
        <button className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors">
          Plan Menu
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-blue-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Guests</p>
              <p className="text-3xl text-blue-600">45</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Meals Served Today</p>
              <p className="text-3xl text-green-600">85</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-orange-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-10 h-10 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Special Requests</p>
              <p className="text-3xl text-orange-600">11</p>
            </div>
          </div>
        </div>
        <div className="bg-white border-2 border-purple-200 rounded-sm p-6">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-10 h-10 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Menu Items</p>
              <p className="text-3xl text-purple-600">24</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Meal Schedule */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Today's Meal Schedule</h3>
          <p className="text-sm text-gray-600 mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <div className="p-6 space-y-4">
          {mealSchedule.map((meal, index) => (
            <div key={index} className="border border-gray-200 rounded-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#00247D] bg-opacity-10 rounded-sm flex items-center justify-center">
                    <UtensilsCrossed className="w-8 h-8 text-[#00247D]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900">{meal.meal}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Clock className="w-4 h-4" />
                      {meal.time}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${
                  meal.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  meal.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {meal.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Expected Guests</p>
                  <p className="text-xl text-gray-900">{meal.guests}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Special Requests</p>
                  <p className="text-xl text-orange-600">{meal.specialRequests}</p>
                </div>
                <div className="md:col-span-1">
                  <p className="text-sm text-gray-600">Menu</p>
                  <p className="text-sm text-gray-900 mt-1">{meal.menu}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-sm hover:bg-blue-50">
                  View Details
                </button>
                <button className="px-4 py-2 text-sm text-green-600 border border-green-600 rounded-sm hover:bg-green-50">
                  Update Menu
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Dietary Requirements */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Special Dietary Requirements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#F5A623] to-[#E09612] border-b border-[#D4951C]">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Guest Name</th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Requirement</th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Applicable To</th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Status</th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {specialRequests.map((request, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{request.guest}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.requirement}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{request.meal}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      request.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Alert */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-orange-900">Inventory Alerts</h4>
            <ul className="mt-2 space-y-1 text-sm text-orange-800">
              <li>• Milk stock running low - reorder required</li>
              <li>• Fresh vegetables needed for dinner service</li>
              <li>• Jain ingredients required for special diet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}