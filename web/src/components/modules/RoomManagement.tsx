import { useState } from 'react';
import { Search, Edit, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Room {
  id: string;
  roomNo: string;
  category: 'VVIP Suite' | 'VIP Room' | 'Standard' | 'Deluxe';
  status: 'Available' | 'Occupied' | 'Reserved' | 'Housekeeping' | 'Maintenance';
  guest: string;
  floor: string;
  capacity: number;
}

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', roomNo: 'A-101', category: 'VVIP Suite', status: 'Occupied', guest: 'Dr. Rajesh Kumar', floor: '1st Floor', capacity: 2 },
    { id: '2', roomNo: 'A-102', category: 'VVIP Suite', status: 'Available', guest: '-', floor: '1st Floor', capacity: 2 },
    { id: '3', roomNo: 'B-201', category: 'VIP Room', status: 'Reserved', guest: 'Reserved for VIP', floor: '2nd Floor', capacity: 2 },
    { id: '4', roomNo: 'B-202', category: 'VIP Room', status: 'Available', guest: '-', floor: '2nd Floor', capacity: 2 },
    { id: '5', roomNo: 'B-205', category: 'VIP Room', status: 'Occupied', guest: 'Mrs. Anita Deshmukh', floor: '2nd Floor', capacity: 2 },
    { id: '6', roomNo: 'C-301', category: 'Standard', status: 'Housekeeping', guest: '-', floor: '3rd Floor', capacity: 1 },
    { id: '7', roomNo: 'C-302', category: 'Standard', status: 'Available', guest: '-', floor: '3rd Floor', capacity: 1 },
    { id: '8', roomNo: 'D-401', category: 'Deluxe', status: 'Maintenance', guest: '-', floor: '4th Floor', capacity: 2 }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newStatus, setNewStatus] = useState<Room['status']>('Available');

  const [isLoading, setIsLoading] = useState(false);

  const handleChangeStatus = async () => {
    if (selectedRoom) {
      try {
        setIsLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setRooms(rooms.map(r => r.id === selectedRoom.id ? { ...r, status: newStatus } : r));
        setIsStatusModalOpen(false);
        setSelectedRoom(null);
      } catch (error) {
        console.error("Failed to update status", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openStatusModal = (room: Room) => {
    setSelectedRoom(room);
    setNewStatus(room.status);
    setIsStatusModalOpen(true);
  };

  const openDetailsModal = (room: Room) => {
    setSelectedRoom(room);
    setIsDetailsModalOpen(true);
  };

  const filteredRooms = rooms.filter(room =>
    room.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.guest.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Occupied': return 'bg-red-100 text-red-800';
      case 'Reserved': return 'bg-yellow-100 text-yellow-800';
      case 'Housekeeping': return 'bg-blue-100 text-blue-800';
      case 'Maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'VVIP Suite': return 'bg-purple-100 text-purple-800';
      case 'VIP Room': return 'bg-blue-100 text-blue-800';
      case 'Deluxe': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-[#00247D]">Room Management</h2>
        <p className="text-gray-600 text-sm mt-1">Manage room status and allocations | कक्ष प्रबंधन</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by room number, category, or guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Room List Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5A623] text-white">
                <th className="px-4 py-3 text-left text-sm">Room No</th>
                <th className="px-4 py-3 text-left text-sm">Category</th>
                <th className="px-4 py-3 text-left text-sm">Status</th>
                <th className="px-4 py-3 text-left text-sm">Guest</th>
                <th className="px-4 py-3 text-left text-sm">Floor</th>
                <th className="px-4 py-3 text-left text-sm">Capacity</th>
                <th className="px-4 py-3 text-left text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room, index) => (
                <tr key={room.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-900">
                    {room.roomNo}
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200">
                    <span className={`inline-block px-2 py-1 rounded-sm text-xs ${getCategoryColor(room.category)}`}>
                      {room.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200">
                    <span className={`inline-block px-2 py-1 rounded-sm text-xs ${getStatusColor(room.status)}`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                    {room.guest}
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                    {room.floor}
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                    {room.capacity} {room.capacity === 1 ? 'Person' : 'Persons'}
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailsModal(room)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openStatusModal(room)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Change Status"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Change Room Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Room: <span className="text-gray-900">{selectedRoom?.roomNo}</span></p>
              <p className="text-sm text-gray-600">Current Status: <span className="text-gray-900">{selectedRoom?.status}</span></p>
            </div>
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Occupied">Occupied</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
                <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleChangeStatus} className="bg-[#00247D] hover:bg-[#003399] text-white" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Room Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Room Number</p>
                <p className="text-gray-900">{selectedRoom?.roomNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-gray-900">{selectedRoom?.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-gray-900">{selectedRoom?.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Floor</p>
                <p className="text-gray-900">{selectedRoom?.floor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="text-gray-900">{selectedRoom?.capacity} {selectedRoom?.capacity === 1 ? 'Person' : 'Persons'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Guest</p>
                <p className="text-gray-900">{selectedRoom?.guest}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
