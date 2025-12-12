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
    guest_designation: "",
    guest_mobile: "",
    guest_alternate_mobile: "",
    guest_address: "",
    id_proof_type: "" as
      | "Aadhaar"
      | "PAN"
      | "Passport"
      | "Driving License"
      | "Voter-ID"
      | "Other",
    id_proof_no: "",
    email: "",
    checkin_date: "",
    checkout_date: "",
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
      // note: we pass the whole guestForm object — backend should accept added fields (designation, dates)
      const guest = await createGuest(guestForm);

      // 2. Create Guest IN/OUT entry
      await createGuestInOut({
        guest_id: guest.guest_id, // returned from backend
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
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#F5A623] to-[#E09612]">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Deisgnation</th>
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
                      <button
                        onClick={() => {
                          setSelectedGuest(g);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => openInfoModal(g)} className="icon-btn text-purple-600">
                        <FileText className="w-4 h-4" />
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

            <p>
              <strong>Name:</strong> {selectedGuest.name}
            </p>
            <p>
              <strong>Designation:</strong> {selectedGuest.designation}
            </p>
            <p>
              <strong>Status:</strong> {selectedGuest.status}
            </p>

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
              Are you sure you want to delete guest <strong>{selectedGuest.name}</strong>? This
              action cannot be undone.
            </p>

            <div className="modalActions">
              <button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</button>

              <button className="saveBtn" style={{ backgroundColor: "red" }} onClick={handleDeleteGuest}>
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
{/* ADD GUEST MODAL */}
      {showAddGuestModal && (
        <div className="modalOverlay">
          <div className="nicModal">
            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Add New Guest</h2>
              <button className="closeBtn" onClick={() => setShowAddGuestModal(false)}>
                ✕
              </button>
            </div>

            {/* 2-COLUMN FORM GRID */}
            <div className="nicFormGrid">
              <div>
                <label>Full Name *</label>
                <input className="nicInput" value={guestForm.guest_name} onChange={(e) => updateGuestForm("guest_name", e.target.value)} />
              </div>

              <div>
                <label>Name (Local Language)</label>
                <input className="nicInput" value={guestForm.guest_name_local_language} onChange={(e) => updateGuestForm("guest_name_local_language", e.target.value)} />
              </div>

              <div>
                <label>Designation</label>
                <input className="nicInput" value={guestForm.guest_designation} onChange={(e) => updateGuestForm("guest_designation", e.target.value)} />
              </div>

              <div>
                <label>Mobile Number *</label>
                <input className="nicInput" value={guestForm.guest_mobile} onChange={(e) => updateGuestForm("guest_mobile", e.target.value)} />
              </div>

              <div>
                <label>Alternate Mobile</label>
                <input className="nicInput" value={guestForm.guest_alternate_mobile} onChange={(e) => updateGuestForm("guest_alternate_mobile", e.target.value)} />
              </div>

              <div>
                <label>Category</label>
                {/* placeholder category field to keep layout parity with screenshot 1 (if you need a select here replace accordingly) */}
                <input className="nicInput" />
              </div>

              {/* Full width field */}
              <div className="fullWidth">
                <label>Address</label>
                <textarea className="nicInput" value={guestForm.guest_address} onChange={(e) => updateGuestForm("guest_address", e.target.value)} />
              </div>

              {/* Check-in Date */}
              <div>
                <label>Check-in Date</label>
                <input
                  type="date"
                  className="nicInput"
                  value={guestForm.checkin_date}
                  onChange={(e) => updateGuestForm("checkin_date", e.target.value)}
                />
              </div>

              {/* Check-out Date */}
              <div>
                <label>Check-out Date</label>
                <input
                  type="date"
                  className="nicInput"
                  value={guestForm.checkout_date}
                  onChange={(e) => updateGuestForm("checkout_date", e.target.value)}
                />
              </div>

              {/* ID PROOF */}
              <div>
                <label>ID Proof Type</label>
                <select
                  className="nicInput"
                  value={guestForm.id_proof_type}
                  onChange={(e) =>
                    updateGuestForm(
                      "id_proof_type",
                      e.target.value as "Aadhaar" | "PAN" | "Passport" | "Driving License" | "Voter-ID" | "Other"
                    )
                  }
                >
                  <option value="">Select</option>
                  <option value="Aadhaar">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter-ID">Voter ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label>ID Proof Number</label>
                <input className="nicInput" value={guestForm.id_proof_no} onChange={(e) => updateGuestForm("id_proof_no", e.target.value)} />
              </div>

              <div className="fullWidth">
                <label>Email</label>
                <input className="nicInput" value={guestForm.email} onChange={(e) => updateGuestForm("email", e.target.value)} />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setShowAddGuestModal(false)}>
                Cancel
              </button>
              <button className="saveBtn" onClick={submitNewGuest}>
                Add Guest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
