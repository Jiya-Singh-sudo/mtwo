import { useEffect, useState } from "react";
import { Search, Plus, Eye, Edit, FileText, Trash2 } from "lucide-react";
import { createGuest, getActiveGuests } from "@/api/guest.api";
import { getActiveGuestDesignations } from "@/api/guestDesignation.api";
import { createGuestDesignation } from "@/api/guestDesignation.api";
import { createGuestInOut } from "@/api/guestInOut.api";
import { updateGuest } from "@/api/guest.api";
import { updateGuestDesignation } from "@/api/guestDesignation.api";
import { updateGuestInOut } from "@/api/guestInOut.api";
import { softDeleteGuestInOut } from "@/api/guestInOut.api";
import { getAllGuestInOut } from "@/api/guestInOut.api";
import { getGuestById } from "@/api/guest.api";
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
  guest_mobile: string;
  guest_alternate_mobile: string;
  email: string;
  guest_address: string;
  id_proof_type: "Aadhaar" | "PAN" | "Passport" | "Driving License" | "Voter-ID" | "Other";
  id_proof_no: string;
}

export function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const initialGuestFormState = {
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
    checkout_date: ""
  };

  const initialDesignationState = {
    designation_id: "",
    department: "",
    organization: "",
    office_location: ""
  };


  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestForm, setGuestForm] = useState(initialGuestFormState);
  const [designationForm, setDesignationForm] = useState(initialDesignationState);

  const [editGuestForm, setEditGuestForm] = useState({
    guest_name: "",
    guest_mobile: "",
    guest_alternate_mobile: "",
    guest_address: "",
    email: "",
    id_proof_type: "" as
      | "Aadhaar"
      | "PAN"
      | "Passport"
      | "Driving License"
      | "Voter-ID"
      | "Other",
    id_proof_no: ""
  });

  const [editDesignationForm, setEditDesignationForm] = useState({
    gd_id: "",
    designation_id: "",
    department: "",
    organization: "",
    office_location: ""
  });

  const [editInOutForm, setEditInOutForm] = useState({
    inout_id: "",
    entry_date: "",
    exit_date: "",
    status: "Entered" as "Entered" | "Inside" | "Exited"
  });
  const [selectedGuestFullInfo, setSelectedGuestFullInfo] = useState<any>(null);
  /* ----- MODAL STATES ----- */
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function updateGuestForm(field: string, value: string) {
    setGuestForm((prev) => ({ ...prev, [field]: value }));
  }
  function updateDesignationForm(field: string, value: string) {
    setDesignationForm(prev => ({ ...prev, [field]: value }));
  }

  async function submitNewGuest() {
    if (!guestForm.guest_name.trim() || !guestForm.guest_mobile.trim()) {
      alert("Name and mobile number are required.");
      return;
    }
    if (!guestForm.guest_mobile.trim() ||guestForm.guest_mobile.length < 10 || guestForm.guest_mobile.length > 10) {
      alert("Mobile number is required and must be at least 10 digits.");
      return;
    }
    if (!guestForm.checkin_date.trim() || !guestForm.checkout_date.trim()) {
      alert("Check-in and check-out dates are required.");
      return;
    }
    if (!guestForm.id_proof_type.trim() || !guestForm.id_proof_no.trim()) {
      alert("ID proof type and number are required.");
      return;
    }
    if (!guestForm.email.trim() || !guestForm.email.includes("@")) {
      alert("Email is required and must be valid.");
      return;
    }
    if (!designationForm.designation_id.trim() || !designationForm.department.trim() || !designationForm.organization.trim() || !designationForm.office_location.trim()) {
      alert("Designation ID, department, organization, and office location are required.");
      return;
    }
    try {
      // 1️⃣ Create guest (m_guest)
      const guest = await createGuest({
        guest_name: guestForm.guest_name,
        guest_name_local_language: guestForm.guest_name_local_language,
        guest_mobile: guestForm.guest_mobile,
        guest_alternate_mobile: guestForm.guest_alternate_mobile,
        guest_address: guestForm.guest_address,
        id_proof_type: guestForm.id_proof_type,
        id_proof_no: guestForm.id_proof_no,
        email: guestForm.email
      });

      const guestId = guest.guest_id;

      // 2️⃣ Create designation (t_guest_designation)
      await createGuestDesignation({
        guest_id: guestId,
        designation_id: designationForm.designation_id,
        department: designationForm.department,
        organization: designationForm.organization,
        office_location: designationForm.office_location
      });

      // 3️⃣ Create guest in/out entry (t_guest_inout)
      const now = new Date();
      const entry_date = now.toISOString().split("T")[0];
      const entry_time = now.toTimeString().slice(0, 5);

      await createGuestInOut({
        guest_id: guestId,
        entry_date,
        entry_time,
        status: "Entered",
        guest_inout: true,
        remarks: "",
        purpose: "Visit"
      });

      setShowAddGuestModal(false);
      setGuestForm(initialGuestFormState);
      setDesignationForm(initialDesignationState);
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
      // 1️⃣ Load guest master
      const guestData = await getActiveGuests();

      // 2️⃣ Load designation table
      const designationData = await getActiveGuestDesignations();

      // 3️⃣ Load in/out table
      const inOutData = await getAllGuestInOut();

      // 4️⃣ Merge data
      const mapped = guestData.map((g: any) => {
        const designation = designationData.find((d: any) => d.guest_id === g.guest_id);
        const inout = inOutData.find((io: any) => io.guest_id === g.guest_id);

        return {
          id: g.guest_id,
          inout_id: inout?.inout_id || "",
          name: g.guest_name,

          // designation table
          designation: designation?.designation_id || "N/A",

          // status from in/out (NOT is_active)
          status: inout?.status || "Unknown",

          // dates from in/out
          arrival: inout?.entry_date || "-",
          departure: inout?.exit_date || "-",

          // table still expects these ↓
          guest_mobile: g.guest_mobile || "",
          guest_alternate_mobile: g.guest_alternate_mobile || "",
          email: g.email || "",
          guest_address: g.guest_address || "",
          id_proof_type: g.id_proof_type || "",
          id_proof_no: g.id_proof_no || "",
        };
      });

      setGuests(mapped);
    } catch (err) {
      console.error("Failed to load guests", err);
    }
  }


  /* ----------------- BUTTON HANDLERS ----------------- */
  async function openViewModal(g: Guest) {
    setSelectedGuest(g);

    // 1️⃣ Fetch all designations and find the one for this guest
    const allDesignations = await getActiveGuestDesignations();
    const d = allDesignations.find((x: any) => x.guest_id === g.id);

    // 2️⃣ Fetch all GuestInOut entries and find the one for this guest
    const allInOut = await getAllGuestInOut();
    const io = allInOut.find((x: any) => x.guest_id === g.id);

    // 3️⃣ Build a unified readable object
    setSelectedGuestFullInfo({
      basic: {
        id: g.id,
        name: g.name,
        mobile: g.guest_mobile,
        alt_mobile: g.guest_alternate_mobile,
        email: g.email,
        address: g.guest_address,
        id_proof_type: g.id_proof_type,
        id_proof_no: g.id_proof_no
      },

      designation: {
        designation_id: d?.designation_id || "N/A",
        department: d?.department || "N/A",
        organization: d?.organization || "N/A",
        office_location: d?.office_location || "N/A",
        is_current: d?.is_current
      },

      visit: {
        status: io?.status || "N/A",
        arrival: io?.entry_date || "-",
        departure: io?.exit_date || "-",
        room: io?.room_id || "N/A"
      }
    });

    setShowViewModal(true);
  }

  async function openEditModal(g: Guest) {
    setSelectedGuest(g);

    // 1️⃣ Load full guest info (m_guest)
    const fullGuest = await getGuestById(g.id);

    setEditGuestForm({
      guest_name: fullGuest.guest_name,
      guest_mobile: fullGuest.guest_mobile,
      guest_alternate_mobile: fullGuest.guest_alternate_mobile,
      guest_address: fullGuest.guest_address,
      email: fullGuest.email,
      id_proof_type: fullGuest.id_proof_type,
      id_proof_no: fullGuest.id_proof_no
    });

    // 2️⃣ Load full designation info
    const allDesignations = await getActiveGuestDesignations();
    const d = allDesignations.find((x: any) => x.guest_id === g.id);

    setEditDesignationForm({
      gd_id: d?.gd_id || "",
      designation_id: d?.designation_id || "",
      department: d?.department || "",
      organization: d?.organization || "",
      office_location: d?.office_location || ""
    });

    // 3️⃣ Load in/out info
    const allInOut = await getAllGuestInOut();
    const io = allInOut.find((x: any) => x.guest_id === g.id);

    setEditInOutForm({
      inout_id: io?.inout_id || "",
      entry_date: io?.entry_date || "",
      exit_date: io?.exit_date || "",
      status:
        io?.status === "Entered" || io?.status === "Inside" || io?.status === "Exited"
          ? io.status
          : "Entered"
    });

    setShowEditModal(true);
  }


  async function submitGuestEdit() {
    try {
      // 1️⃣ Update Guest (m_guest)
      await updateGuest(selectedGuest!.name, {
        guest_name: editGuestForm.guest_name,
        guest_mobile: editGuestForm.guest_mobile,
        guest_alternate_mobile: editGuestForm.guest_alternate_mobile,
        guest_address: editGuestForm.guest_address,
        email: editGuestForm.email,
        id_proof_type: editGuestForm.id_proof_type,
        id_proof_no: editGuestForm.id_proof_no
      });

      // 2️⃣ Update Designation (t_guest_designation)
      await updateGuestDesignation(editDesignationForm.gd_id, {
        designation_id: editDesignationForm.designation_id,
        department: editDesignationForm.department,
        organization: editDesignationForm.organization,
        office_location: editDesignationForm.office_location,
        is_current: true
      });

      // 3️⃣ Update IN/OUT (t_guest_inout)
      await updateGuestInOut(editInOutForm.inout_id, {
        entry_date: editInOutForm.entry_date,
        exit_date: editInOutForm.exit_date,
        status: editInOutForm.status
      });

      setShowEditModal(false);
      loadGuests(); // refresh table

    } catch (err) {
      console.error("Edit failed:", err);
      alert("Failed to update guest");
    }
  }

  async function handleDeleteGuest() {
    if (!selectedGuest) return;

    try {
      // delete ONLY the guestInOut record
      await softDeleteGuestInOut(selectedGuest.inout_id);

      setIsDeleteDialogOpen(false);
      loadGuests(); // refresh table

    } catch (err) {
      console.error("Failed to delete guest in/out entry:", err);
      alert("Failed to delete entry");
    }
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
          onClick={() => { setShowAddGuestModal(true), setGuestForm(initialGuestFormState), setDesignationForm(initialDesignationState) }}
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

                  <td className="px-6 py-4">
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-gray-500">{g.designation}</p>
                  </td>

                  <td className="px-6 py-4">{g.status}</td>

                  <td className="px-6 py-4">
                    <p>{g.arrival}</p>
                    <p className="text-xs text-gray-500">to {g.departure}</p>
                  </td>

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
      {showViewModal && selectedGuestFullInfo && (
        <div className="modalOverlay">
          <div className="modal largeModal">

            <h2>Guest Details</h2>

            {/* BASIC INFO */}
            <div className="section">
              <h3>Basic Information</h3>
              <p><strong>Name:</strong> {selectedGuestFullInfo.basic.name}</p>
              <p><strong>Mobile:</strong> {selectedGuestFullInfo.basic.mobile || "N/A"}</p>
              <p><strong>Alternate Mobile:</strong> {selectedGuestFullInfo.basic.alt_mobile || "N/A"}</p>
              <p><strong>Email:</strong> {selectedGuestFullInfo.basic.email || "N/A"}</p>
              <p><strong>Address:</strong> {selectedGuestFullInfo.basic.address || "N/A"}</p>
              <p><strong>ID Proof:</strong> {selectedGuestFullInfo.basic.id_proof_type} - {selectedGuestFullInfo.basic.id_proof_no}</p>
            </div>

            {/* DESIGNATION */}
            <div className="section">
              <h3>Designation Details</h3>
              <p><strong>Designation ID:</strong> {selectedGuestFullInfo.designation.designation_id}</p>
              <p><strong>Department:</strong> {selectedGuestFullInfo.designation.department}</p>
              <p><strong>Organization:</strong> {selectedGuestFullInfo.designation.organization}</p>
              <p><strong>Office Location:</strong> {selectedGuestFullInfo.designation.office_location}</p>
            </div>

            {/* VISIT / IN-OUT */}
            <div className="section">
              <h3>Visit Information</h3>
              <p><strong>Status:</strong> {selectedGuestFullInfo.visit.status}</p>
              <p><strong>Arrival:</strong> {selectedGuestFullInfo.visit.arrival}</p>
              <p><strong>Departure:</strong> {selectedGuestFullInfo.visit.departure}</p>
              <p><strong>Room:</strong> {selectedGuestFullInfo.visit.room}</p>
            </div>

            <div className="modalActions">
              <button onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}



      {/* EDIT GUEST */}
      {showEditModal && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal largeModal">
            <h3>Edit Guest</h3>

            {/* BASIC INFO */}
            <h4>Basic Information</h4>

            <label>Name</label>
            <input
              className="modalInput"
              value={editGuestForm.guest_name}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, guest_name: e.target.value })
              }
            />

            <label>Mobile</label>
            <input
              className="modalInput"
              value={editGuestForm.guest_mobile}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, guest_mobile: e.target.value })
              }
            />

            {/* DESIGNATION */}
            <h4>Designation</h4>

            <label>Designation ID</label>
            <input
              className="modalInput"
              value={editDesignationForm.designation_id}
              onChange={(e) =>
                setEditDesignationForm({ ...editDesignationForm, designation_id: e.target.value })
              }
            />

            <label>Department</label>
            <input
              className="modalInput"
              value={editDesignationForm.department}
              onChange={(e) =>
                setEditDesignationForm({ ...editDesignationForm, department: e.target.value })
              }
            />

            <label>Organization</label>
            <input
              className="modalInput"
              value={editDesignationForm.organization}
              onChange={(e) =>
                setEditDesignationForm({ ...editDesignationForm, organization: e.target.value })
              }
            />

            <label>Office Location</label>
            <input
              className="modalInput"
              value={editDesignationForm.office_location}
              onChange={(e) =>
                setEditDesignationForm({ ...editDesignationForm, office_location: e.target.value })
              }
            />

            {/* IN/OUT */}
            <h4>Visit Details</h4>

            <label>Check-in Date</label>
            <input
              type="date"
              className="modalInput"
              value={editInOutForm.entry_date}
              onChange={(e) =>
                setEditInOutForm({ ...editInOutForm, entry_date: e.target.value })
              }
            />

            <label>Check-out Date</label>
            <input
              type="date"
              className="modalInput"
              value={editInOutForm.exit_date}
              onChange={(e) =>
                setEditInOutForm({ ...editInOutForm, exit_date: e.target.value })
              }
            />

            <label>Status</label>
            <select
              className="modalInput"
              value={editInOutForm.status}
              onChange={(e) =>
                setEditInOutForm({ ...editInOutForm, status: e.target.value as "Entered" | "Inside" | "Exited" })
              }
            >
              <option value="Entered">Entered</option>
              <option value="Exited">Exited</option>
              <option value="Inside">Inside</option>
            </select>

            {/* ACTIONS */}
            <div className="modalActions">
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="saveBtn" onClick={submitGuestEdit}>
                Save Changes
              </button>
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
                <input className="nicInput" value={designationForm.designation_id} onChange={(e) => updateDesignationForm("designation_id", e.target.value)} />
              </div>

              <div>
              <label>Department</label>
              <input className="nicInput" value={designationForm.department} onChange={(e) => updateDesignationForm("department", e.target.value)} />
              </div>

              <div>
              <label>Organization</label>
              <input className="nicInput" value={designationForm.organization} onChange={(e) => updateDesignationForm("organization", e.target.value)} />
              </div>

              <div>
              <label>Office Location</label>
              <input className="nicInput" value={designationForm.office_location} onChange={(e) => updateDesignationForm("office_location", e.target.value)} />
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
