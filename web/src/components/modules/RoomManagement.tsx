export function RoomManagement() {
  const floors = [
    {
      name: 'Ground Floor',
      rooms: [
        { number: '101', status: 'available', type: 'Standard', guest: null },
        { number: '102', status: 'occupied', type: 'Standard', guest: 'Shri A. Kumar' },
        { number: '103', status: 'available', type: 'Standard', guest: null },
        { number: '104', status: 'housekeeping', type: 'Standard', guest: null },
        { number: '105', status: 'occupied', type: 'Deluxe', guest: 'Shri Amit Verma' },
      ]
    },
    {
      name: 'First Floor',
      rooms: [
        { number: '201', status: 'occupied', type: 'Suite', guest: 'Shri Rajesh Kumar' },
        { number: '202', status: 'reserved', type: 'Suite', guest: 'Reserved for VIP' },
        { number: '203', status: 'available', type: 'Deluxe', guest: null },
        { number: '204', status: 'maintenance', type: 'Deluxe', guest: null },
        { number: '205', status: 'available', type: 'Standard', guest: null },
      ]
    },
    {
      name: 'Second Floor',
      rooms: [
        { number: '301', status: 'available', type: 'Standard', guest: null },
        { number: '302', status: 'occupied', type: 'Standard', guest: 'Dr. Singh' },
        { number: '303', status: 'available', type: 'Standard', guest: null },
        { number: '304', status: 'reserved', type: 'Deluxe', guest: 'Reserved' },
        { number: '305', status: 'maintenance', type: 'Standard', guest: null },
      ]
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500 border-green-600';
      case 'occupied': return 'bg-red-500 border-red-600';
      case 'reserved': return 'bg-yellow-500 border-yellow-600';
      case 'housekeeping': return 'bg-blue-500 border-blue-600';
      case 'maintenance': return 'bg-gray-500 border-gray-600';
      default: return 'bg-gray-300 border-gray-400';
    }
  };

  const stats = [
    { label: 'Available', count: 12, color: 'bg-green-500' },
    { label: 'Occupied', count: 20, color: 'bg-red-500' },
    { label: 'Reserved', count: 5, color: 'bg-yellow-500' },
    { label: 'Housekeeping', count: 1, color: 'bg-blue-500' },
    { label: 'Maintenance', count: 2, color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[#00247D]">Room Management</h2>
        <p className="text-sm text-gray-600">कक्ष प्रबंधन - Floor-wise room status and allocation</p>
      </div>

      {/* Status Legend */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <h3 className="text-[#00247D] mb-4">Room Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className={`w-6 h-6 ${stat.color} rounded`} />
              <div>
                <p className="text-sm text-gray-700">{stat.label}</p>
                <p className="text-xl text-[#00247D]">{stat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floor-wise Room Layout */}
      <div className="space-y-6">
        {floors.map((floor) => (
          <div key={floor.name} className="bg-white border border-gray-200 rounded-sm p-6">
            <h3 className="text-[#00247D] mb-4">{floor.name}</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {floor.rooms.map((room) => (
                <button
                  key={room.number}
                  className={`${getStatusColor(room.status)} border-2 rounded-sm p-4 hover:shadow-lg transition-all text-white text-left`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-lg">{room.number}</p>
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      {room.type}
                    </span>
                  </div>
                  <p className="text-xs opacity-90 capitalize">{room.status}</p>
                  {room.guest && (
                    <p className="text-xs mt-2 opacity-90 truncate">{room.guest}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-[#00247D] text-white p-4 rounded-sm hover:bg-blue-900 transition-colors">
          <p>Smart Room Allocation</p>
          <p className="text-xs opacity-90 mt-1">Auto-suggest based on category</p>
        </button>
        <button className="bg-green-600 text-white p-4 rounded-sm hover:bg-green-700 transition-colors">
          <p>Housekeeping Schedule</p>
          <p className="text-xs opacity-90 mt-1">Manage cleaning roster</p>
        </button>
        <button className="bg-orange-600 text-white p-4 rounded-sm hover:bg-orange-700 transition-colors">
          <p>Maintenance Log</p>
          <p className="text-xs opacity-90 mt-1">View repair history</p>
        </button>
      </div>
    </div>
  );
}
