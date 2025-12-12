import { useEffect, useState } from "react";
import { Search, Plus, Eye, Edit, FileText, BedDouble, Car, Trash2 } from "lucide-react";
import { createGuest, getActiveGuestsWithInOut } from "@/api/guest.api";
import { createGuestRoom } from "@/api/guestRoom.api";
import { softDeleteGuestInout, createGuestInOut } from "@/api/guestInOut.api";
import "./GuestManagementModals.css"; // <-- you will create this CSS (I'll give it below)

/* ----------------- TYPES ----------------- */
export interface Guest {
  id: string;
  inout_id: string;
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
  const [guestForm, setGuestForm] = useState({
    guest_name: "",
    guest_name_local_language: "",
    guest_mobile: "",
    guest_alternate_mobile: "",
    guest_address: "",
    id_proof_type: "" as "Aadhaar" | "PAN" | "Passport" | "Driving License" | "Voter-ID" | "Other",
    id_proof_no: "",
    email: "",
  });
  /* ----- MODAL STATES ----- */
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  /* ----- ROOM DATA ----- */
  const [roomData, setRoomData] = useState({
    room_id: "",
    action_type: "Room-Allocated",
    action_description: "",
  });

  function updateGuestForm(field: string, value: string) {
    setGuestForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitNewGuest() {
  if (!guestForm.guest_name.trim() || !guestForm.guest_mobile.trim()) {
    alert("Name and mobile number are required.");
    return;
  }
  try {
    const now = new Date();
    const entry_date = now.toISOString().split("T")[0];
    const entry_time = now.toTimeString().slice(0, 5);

    // 1. Create Guest
    const guest = await createGuest(guestForm);

    // 2. Create Guest IN/OUT entry
    await createGuestInOut({
      guest_id: guest.guest_id,   // returned from backend
      entry_date,
      entry_time,
      status: "Entered",
      guest_inout: true,
      remarks: "",
      purpose: "Visit",
    });

    setShowAddGuestModal(false);
    loadGuests();

  } catch (err) {
    console.error("Guest creation failed:", err);
  }
}



  /* ----------------------------------------
     LOADING GUESTS FROM BACKEND
  ---------------------------------------- */
  useEffect(() => {
    loadGuests();
  }, []);

  async function loadGuests() {
    try {
      const data = await getActiveGuestsWithInOut();
      const mapped = data.map((g: any) => ({
        id: g.guest_id,
        inout_id: g.inout_id,
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

    const now = new Date();
    const action_date = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const action_time = now.toTimeString().slice(0, 5);  // HH:mm

    try {
      await createGuestRoom({
        guest_id: selectedGuest.id,
        room_id: roomData.room_id,
        action_type: "Room-Allocated",
        action_description: roomData.action_description,
        action_date,
        action_time,
      });

      setShowRoomModal(false);
      loadGuests();
    } catch (err) {
      console.error("Room assignment failed:", err);
    }
  }

  async function handleDeleteGuest() {
    if (!selectedGuest) return;
    try {
      await softDeleteGuestInout(selectedGuest.inout_id);
      setIsDeleteDialogOpen(false);
      loadGuests();
    } catch (err) {
      console.error("Delete failed", err);
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
                      <button onClick={() => { setSelectedGuest(g); setIsDeleteDialogOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
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

      {/* DELETE GUEST */}
      {isDeleteDialogOpen && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Confirm Deletion</h3>

            <p>
              Are you sure you want to delete guest <strong>{selectedGuest.name}</strong>?  
              This action cannot be undone.
            </p>

            <div className="modalActions">
              <button onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </button>

              <button
                className="saveBtn"
                style={{ backgroundColor: "red" }}
                onClick={handleDeleteGuest}
              >
                Delete
              </button>
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

          <label>Full Name *</label>
          <input
            className="modalInput"
            value={guestForm.guest_name}
            onChange={(e) => updateGuestForm("guest_name", e.target.value)}
          />

          <label>Name (Local Language)</label>
          <input
            className="modalInput"
            value={guestForm.guest_name_local_language}
            onChange={(e) => updateGuestForm("guest_name_local_language", e.target.value)}
          />

          <label>Mobile Number *</label>
          <input
            className="modalInput"
            value={guestForm.guest_mobile}
            onChange={(e) => updateGuestForm("guest_mobile", e.target.value)}
          />

          <label>Alternate Mobile</label>
          <input
            className="modalInput"
            value={guestForm.guest_alternate_mobile}
            onChange={(e) => updateGuestForm("guest_alternate_mobile", e.target.value)}
          />

          <label>Address</label>
          <textarea
            className="modalInput"
            value={guestForm.guest_address}
            onChange={(e) => updateGuestForm("guest_address", e.target.value)}
          />

          <label>ID Proof Type</label>
          <select
            className="modalInput"
            value={guestForm.id_proof_type}
            onChange={(e) => updateGuestForm("id_proof_type", e.target.value as "Aadhaar" | "PAN" | "Voter-ID" | "Driving License" | "Passport" | "Other")}
          >
            <option value="">Select</option>
            <option value="Aadhaar">Aadhar</option>
            <option value="PAN">PAN</option>
            <option value="Voter-ID">Voter ID</option>
            <option value="Driving License">Driving License</option>
            <option value="Passport">Passport</option>
            <option value="Other">Other</option>
          </select>

          <label>ID Proof Number</label>
          <input
            className="modalInput"
            value={guestForm.id_proof_no}
            onChange={(e) => updateGuestForm("id_proof_no", e.target.value)}
          />

          <label>Email</label>
          <input
            className="modalInput"
            value={guestForm.email}
            onChange={(e) => updateGuestForm("email", e.target.value)}
          />

          <div className="modalActions">
            <button onClick={() => setShowAddGuestModal(false)}>Cancel</button>
            <button className="saveBtn" onClick={submitNewGuest}>Add Guest</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
