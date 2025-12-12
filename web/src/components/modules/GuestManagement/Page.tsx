import { useEffect, useState } from "react";
import { Search, Plus, Eye, Edit, FileText, BedDouble, Car } from "lucide-react";
import { getActiveGuests } from "@/api/guest.api";
import { createGuestRoom } from "@/api/guestRoom.api";
import "./GuestManagementModals.css"; // <-- you will create this CSS (I'll give it below)

/* ----------------- TYPES ----------------- */
export interface Guest {
  id: string;
  name: string;
  designation: string;
  department: string;
  category: string;
  status: string;
  arrival: string;
  departure: string;
  room: string;
}

export function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>([]);

  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  /* ----- MODAL STATES ----- */
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);

  /* ----- ROOM DATA ----- */
  const [roomData, setRoomData] = useState({
    room_id: "",
    action_type: "Room-Allocated",
    action_description: "",
  });

  /* ----------------------------------------
     LOADING GUESTS FROM BACKEND
  ---------------------------------------- */
  useEffect(() => {
    loadGuests();
  }, []);

  async function loadGuests() {
    try {
      const data = await getActiveGuests();
      const mapped = data.map((g: any) => ({
        id: g.guest_id,
        name: g.guest_name,
        designation: g.designation || "N/A",
        department: g.department || "N/A",
        category: g.category || "Official",
        status: g.is_active ? "Active" : "Inactive",
        arrival: g.arrival || "-",
        departure: g.departure || "-",
        room: g.room || "-",
      }));
      setGuests(mapped);
    } catch (err) {
      console.error("Failed to load guests", err);
    }
  }

  /* ----------------- BUTTON HANDLERS ----------------- */
  function openViewModal(g: Guest) {
    setSelectedGuest(g);
    setShowViewModal(true);
  }

  function openEditModal(g: Guest) {
    setSelectedGuest(g);
    setShowEditModal(true);
  }

  function openInfoModal(g: Guest) {
    setSelectedGuest(g);
    setShowInfoModal(true);
  }

  function openRoomModal(g: Guest) {
    setSelectedGuest(g);
    setRoomData({ room_id: "", action_type: "Room-Allocated", action_description: "" });
    setShowRoomModal(true);
  }

  function openVehicleModal(g: Guest) {
    setSelectedGuest(g);
    setShowVehicleModal(true);
  }

  /* ----------------- ROOM ASSIGNMENT ----------------- */
  async function assignRoom() {
    if (!selectedGuest) return;

    try {
      await createGuestRoom({
        guest_id: selectedGuest.id,
        room_id: roomData.room_id,
        action_type: "Room-Allocated",
        action_description: roomData.action_description,
      });

      setShowRoomModal(false);
      loadGuests();
    } catch (err) {
      console.error("Room assignment failed:", err);
    }
  }

  /* =====================================================================
     MAIN RENDER
  ===================================================================== */
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Guest Management</h2>
          <p className="text-sm text-gray-600">Manage all guest information and visits</p>
        </div>

        <button
          className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center gap-2"
          onClick={() => setShowAddGuestModal(true)}
        >
          <Plus className="w-5 h-5" />
          Add New Guest
        </button>
      </div>

      {/* SEARCH PANEL */}
      <div className="bg-white border rounded-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="md:col-span-2">
            <label className="text-sm mb-2 block">Search Guest</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, department or ID..."
                className="w-full pl-10 pr-4 py-2 border rounded-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm block mb-2">Status</label>
            <select className="border p-2 rounded w-full">
              <option>All</option>
              <option>Upcoming</option>
              <option>Checked In</option>
              <option>Checked Out</option>
            </select>
          </div>

          <div>
            <label className="text-sm block mb-2">Category</label>
            <select className="border p-2 rounded w-full">
              <option>All</option>
              <option>VVIP</option>
              <option>VIP</option>
              <option>Official</option>
            </select>
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#F5A623] to-[#E09612]">
              <tr>
                <th className="px-6 py-3 text-left">Guest ID</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Stay Period</th>
                <th className="px-6 py-3 text-left">Room</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{g.id}</td>

                  <td className="px-6 py-4">
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-gray-500">{g.designation}</p>
                  </td>

                  <td className="px-6 py-4">{g.department}</td>

                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                      {g.category}
                    </span>
                  </td>

                  <td className="px-6 py-4">{g.status}</td>

                  <td className="px-6 py-4">
                    <p>{g.arrival}</p>
                    <p className="text-xs text-gray-500">to {g.departure}</p>
                  </td>

                  <td className="px-6 py-4">{g.room}</td>

                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openViewModal(g)} className="icon-btn text-blue-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(g)} className="icon-btn text-green-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => openInfoModal(g)} className="icon-btn text-purple-600">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button onClick={() => openRoomModal(g)} className="icon-btn text-orange-600">
                        <BedDouble className="w-4 h-4" />
                      </button>
                      <button onClick={() => openVehicleModal(g)} className="icon-btn text-teal-600">
                        <Car className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------- MODALS BEGIN ------------------------ */}

      {/* VIEW GUEST */}
      {showViewModal && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Guest Details</h3>

            <p><strong>Name:</strong> {selectedGuest.name}</p>
            <p><strong>Designation:</strong> {selectedGuest.designation}</p>
            <p><strong>Department:</strong> {selectedGuest.department}</p>
            <p><strong>Status:</strong> {selectedGuest.status}</p>

            <div className="modalActions">
              <button onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GUEST */}
      {showEditModal && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Edit Guest</h3>

            <label>Name</label>
            <input className="modalInput" defaultValue={selectedGuest.name} />

            <div className="modalActions">
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="saveBtn">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* INFO PACKAGE */}
      {showInfoModal && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Guest Info Package</h3>
            <p>PDF or printable info will appear here.</p>

            <div className="modalActions">
              <button onClick={() => setShowInfoModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ROOM ALLOCATION */}
      {showRoomModal && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Allocate Room for {selectedGuest.name}</h3>

            <label>Room Number</label>
            <input
              className="modalInput"
              value={roomData.room_id}
              onChange={(e) => setRoomData({ ...roomData, room_id: e.target.value })}
            />

            <label>Remarks</label>
            <textarea
              className="modalInput"
              value={roomData.action_description}
              onChange={(e) =>
                setRoomData({ ...roomData, action_description: e.target.value })
              }
            />

            <div className="modalActions">
              <button onClick={() => setShowRoomModal(false)}>Cancel</button>
              <button className="saveBtn" onClick={assignRoom}>Assign Room</button>
            </div>
          </div>
        </div>
      )}

      {/* VEHICLE ASSIGNMENT */}
      {showVehicleModal && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Assign Vehicle</h3>

            <label>Driver</label>
            <input className="modalInput" />

            <label>Vehicle Number</label>
            <input className="modalInput" />

            <label>Pickup Location</label>
            <input className="modalInput" />

            <div className="modalActions">
              <button onClick={() => setShowVehicleModal(false)}>Cancel</button>
              <button className="saveBtn">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GUEST MODAL */}
      {showAddGuestModal && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Add New Guest</h3>

            <label>Full Name</label>
            <input className="modalInput" />

            <label>Designation</label>
            <input className="modalInput" />

            <label>Department</label>
            <input className="modalInput" />

            <label>Category</label>
            <select className="modalInput">
              <option>VVIP</option>
              <option>VIP</option>
              <option>Official</option>
            </select>

            <div className="modalActions">
              <button onClick={() => setShowAddGuestModal(false)}>Cancel</button>
              <button className="saveBtn">Add Guest</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
