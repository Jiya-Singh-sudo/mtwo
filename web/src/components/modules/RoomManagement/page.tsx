'use client';
import { useState, useEffect } from "react";
import { Search, Plus, Loader2 } from 'lucide-react';
import api from "../../../api/apiClient";
import "./RoomManagement.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  getActiveHousekeeping,
  createHousekeeping,
  updateHousekeeping,
  softDeleteHousekeeping,
} from "../../../api/housekeeping.api";
import { getRoomBoyOptions } from "../../../api/housekeeping.api";
import { Button } from "../../ui/button";
import type {
  Housekeeping,
  HousekeepingCreateDto,
  HousekeepingUpdateDto,
} from "../../../types/housekeeping";
import { HK_SHIFTS } from "../../../constants/housekeeping";
import { assignRoomBoyToRoom } from "../../../api/guestHousekeeping.api";
type ShiftType = "Morning" | "Evening" | "Night" | "Full-Day";

/* ================= BACKEND-MATCHING TYPES ================= */
/* Matches DB / API response (snake_case, flat structure) */
type RoomOverviewBackend = {
  room_id: number;
  room_no: string;
  room_name: string;
  residence_type?: string | null;
  status: string;
  guest_name?: string | null;
};
// type EnumValue = {
//   enum_value: string;
// };
type RoomBoyOption = {
  id: string;
  name: string;
};
// Separate type for assignment form (different from HousekeepingCreateDto)
type AssignmentFormType = {
  roomBoyId: string;
  shift: ShiftType | "";
  taskDate: string;
  remarks: string;
};

export function RoomManagement() {
  /* ================= STATE ================= */

  const [rooms, setRooms] = useState<RoomOverviewBackend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------------- ASSIGN ROOM BOY ---------------- */
  const [isRoomBoyModalOpen, setIsRoomBoyModalOpen] = useState(false);
  const [hkShifts, setHkShifts] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [roomBoyOptions, setRoomBoyOptions] = useState<RoomBoyOption[]>([]);


  const [activeRoom, setActiveRoom] =
    useState<RoomOverviewBackend | null>(null);

  // Assignment form (for assigning room boy to a room)
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormType>({
    roomBoyId: "",
    shift: "",
    taskDate: "",
    remarks: "",
  });

  // Room boys management
  const [roomBoys, setRoomBoys] = useState<Housekeeping[]>([]);
  const [roomBoyLoading, setRoomBoyLoading] = useState(true);

  const [selectedRoomBoy, setSelectedRoomBoy] = useState<Housekeeping | null>(null);

  // Modals
  const [showAddRoomBoy, setShowAddRoomBoy] = useState(false);
  const [showEditRoomBoy, setShowEditRoomBoy] = useState(false);
  const [showDeleteRoomBoyConfirm, setShowDeleteRoomBoyConfirm] = useState(false);

  // Room boy create/edit form (HousekeepingCreateDto)
  const [roomBoyForm, setRoomBoyForm] = useState<HousekeepingCreateDto>({
    hk_name: "",
    hk_name_local_language: "",
    hk_contact: "",
    hk_alternate_contact: "",
    address: "",
    shift: "Morning",
  });


  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to load rooms", err);
    }
  }
  async function loadRoomBoysAndShifts() {
    try {
      const boys = await getRoomBoyOptions();

      setRoomBoyOptions(
        boys.map((b) => ({
          id: b.hk_id,
          name: b.hk_name,
        }))
      );

      setHkShifts([...HK_SHIFTS]);
    } catch (err) {
      console.error("Failed to load room boys or shifts", err);
    }
  }

  useEffect(() => {
    loadRoomBoysAndShifts();
  }, []);

  useEffect(() => {
    async function loadRoomBoys() {
      try {
        const data = await getActiveHousekeeping();
        setRoomBoys(data);
      } catch (err) {
        console.error("Failed to load room boys", err);
      } finally {
        setRoomBoyLoading(false);
      }
    }

    loadRoomBoys();
  }, []);


  /* ================= FILTER ================= */

  const filteredRooms = rooms.filter((room) =>
    room.room_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.room_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.residence_type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.guest_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ================= OPEN ASSIGN MODAL ================= */

  async function openAssignRoomBoyModal(room: RoomOverviewBackend) {
    setActiveRoom(room);
    setAssignmentForm({
      roomBoyId: "",
      shift: "",
      taskDate: "",
      remarks: "",
    });
    await loadRoomBoysAndShifts();
    setIsRoomBoyModalOpen(true);
  }


  /* ================= SUBMIT ================= */

  async function submitRoomBoyAssignment() {
    if (!activeRoom) return;

    const { roomBoyId, shift, taskDate } = assignmentForm;

    if (!roomBoyId || !shift || !taskDate) {
      alert("Room boy, shift, and task date are required.");
      return;
    }

    setAssigning(true);

    try {
      await assignRoomBoyToRoom({
        room_id: activeRoom.room_id,
        hk_id: assignmentForm.roomBoyId,
        task_date: assignmentForm.taskDate,
        task_shift: assignmentForm.shift as ShiftType,
        service_type: "Room Cleaning",
        admin_instructions: assignmentForm.remarks || undefined,
      });


      alert("Room boy assigned successfully");
      setIsRoomBoyModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to assign room boy");
    } finally {
      setAssigning(false);
    }
  }

  /* ================= ROOM BOY CRUD ================= */

  const handleAddRoomBoy = async () => {
    try {
      const saved = await createHousekeeping(roomBoyForm);
      setRoomBoys((prev) => [...prev, saved]);
      setShowAddRoomBoy(false);
      resetRoomBoyForm();
    } catch (err) {
      console.error("Failed to create room boy", err);
    }
  };

  const handleEditRoomBoy = async () => {
    if (!selectedRoomBoy) return;

    const payload: HousekeepingUpdateDto = {
      hk_name: roomBoyForm.hk_name,
      hk_name_local_language: roomBoyForm.hk_name_local_language,
      hk_contact: roomBoyForm.hk_contact,
      hk_alternate_contact: roomBoyForm.hk_alternate_contact,
      address: roomBoyForm.address,
      shift: roomBoyForm.shift,
    };

    const updated = await updateHousekeeping(selectedRoomBoy.hk_name, payload);

    setRoomBoys((prev) =>
      prev.map((rb) =>
        rb.hk_id === selectedRoomBoy.hk_id ? updated : rb
      )
    );

    setShowEditRoomBoy(false);
  };

  const handleDeleteRoomBoy = async () => {
    if (!selectedRoomBoy) return;

    await softDeleteHousekeeping(selectedRoomBoy.hk_name);

    setRoomBoys((prev) =>
      prev.filter((rb) => rb.hk_id !== selectedRoomBoy.hk_id)
    );

    setShowDeleteRoomBoyConfirm(false);
  };

  const resetRoomBoyForm = () => {
    setRoomBoyForm({
      hk_name: "",
      hk_name_local_language: "",
      hk_contact: "",
      hk_alternate_contact: "",
      address: "",
      shift: "Morning",
    });
  };

  const openEditRoomBoyModal = (rb: Housekeeping) => {
    setSelectedRoomBoy(rb);
    setRoomBoyForm({
      hk_name: rb.hk_name,
      hk_name_local_language: rb.hk_name_local_language || "",
      hk_contact: rb.hk_contact,
      hk_alternate_contact: rb.hk_alternate_contact || "",
      address: rb.address || "",
      shift: rb.shift as "Morning" | "Evening" | "Night" | "Full-Day",
    });
    setShowEditRoomBoy(true);
  };


  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-[#00247D] font-semibold text-xl">
          Room Management
        </h2>
        <p className="text-gray-600 text-sm">
          Manage rooms and housekeeping assignments
        </p>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="roomBoys">Room Boys</TabsTrigger>
        </TabsList>

        {/* ---------------- ROOMS TAB ---------------- */}
        <TabsContent value="rooms" className="space-y-6">
          {/* SEARCH */}
          <div className="bg-white border rounded-sm p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                placeholder="Search room, guest, residence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* ROOMS TABLE */}
          <div className="bg-white border rounded-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#F5A623] text-white text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">Room No</th>
                  <th className="px-4 py-3 text-left">Residence</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Guest</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No rooms found
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room, idx) => (
                    <tr
                      key={room.room_id}
                      className={idx % 2 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="px-4 py-3 border-t">{room.room_no}</td>
                      <td className="px-4 py-3 border-t">
                        {room.room_name || "—"}
                      </td>
                      <td className="px-4 py-3 border-t">{room.status}</td>
                      <td className="px-4 py-3 border-t">
                        {room.guest_name || "—"}
                      </td>
                      <td className="px-4 py-3 border-t">
                        <button
                          className="text-indigo-600 hover:underline"
                          onClick={() => openAssignRoomBoyModal(room)}
                        >
                          Assign Room Boy
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ---------------- ROOM BOYS TAB ---------------- */}
        <TabsContent value="roomBoys" className="space-y-6">
          {/* Add Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                resetRoomBoyForm();
                setShowAddRoomBoy(true);
              }}
              className="bg-[#00247D] hover:bg-[#003399] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room Boy
            </Button>
          </div>

          {roomBoyLoading ? (
            <div className="bg-white border rounded-sm p-6 text-sm text-gray-500">
              Loading room boys…
            </div>
          ) : (
            <div className="bg-white border rounded-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F5A623] text-white text-sm">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Local Name</th>
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Alt Contact</th>
                    <th className="px-4 py-3 text-left">Shift</th>
                    <th className="px-4 py-3 text-left">Address</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {roomBoys.map((rb, index) => (
                    <tr
                      key={rb.hk_id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-3 border-t">{rb.hk_name}</td>
                      <td className="px-4 py-3 border-t">
                        {rb.hk_name_local_language || "-"}
                      </td>
                      <td className="px-4 py-3 border-t">{rb.hk_contact}</td>
                      <td className="px-4 py-3 border-t">
                        {rb.hk_alternate_contact || "-"}
                      </td>
                      <td className="px-4 py-3 border-t">{rb.shift}</td>
                      <td className="px-4 py-3 border-t">
                        {rb.address || "-"}
                      </td>
                      <td className="px-4 py-3 border-t">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            onClick={() => openEditRoomBoyModal(rb)}
                          >
                            ✏️
                          </button>
                          <button
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            onClick={() => {
                              setSelectedRoomBoy(rb);
                              setShowDeleteRoomBoyConfirm(true);
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ================= ASSIGN ROOM BOY MODAL ================= */}
      {isRoomBoyModalOpen && activeRoom && (
        <div className="modalOverlay">
          <div className="nicModal">

            <div className="nicModalHeader">
              <h2>Assign Room Boy</h2>
              <button onClick={() => setIsRoomBoyModalOpen(false)}>✕</button>
            </div>

            <div className="nicFormGrid">

              <div>
                <label>Room No</label>
                <input
                  className="nicInput"
                  value={activeRoom.room_no}
                  readOnly
                />
              </div>

              <div>
                <label>Room Boy *</label>
                <select
                  className="nicInput"
                  value={assignmentForm.roomBoyId}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      roomBoyId: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  {roomBoyOptions.map((rb) => (
                    <option key={rb.id} value={rb.id}>
                      {rb.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Shift *</label>
                <select
                  className="nicInput"
                  value={assignmentForm.shift}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      shift: e.target.value as ShiftType | "",
                    })
                  }
                >
                  <option value="">Select</option>
                  {hkShifts.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Task Date *</label>
                <input
                  type="date"
                  className="nicInput"
                  value={assignmentForm.taskDate}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      taskDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="fullWidth">
                <label>Remarks</label>
                <textarea
                  className="nicInput"
                  rows={3}
                  value={assignmentForm.remarks}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      remarks: e.target.value,
                    })
                  }
                />
              </div>

            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setIsRoomBoyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="saveBtn"
                onClick={submitRoomBoyAssignment}
                disabled={assigning}
              >
                {assigning ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  "Assign"
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= ADD ROOM BOY MODAL ================= */}
      {showAddRoomBoy && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Add Room Boy</h3>

            <div className="space-y-4">
              <input
                className="nicInput"
                placeholder="Name *"
                value={roomBoyForm.hk_name}
                onChange={(e) =>
                  setRoomBoyForm({ ...roomBoyForm, hk_name: e.target.value })
                }
              />

              <input
                className="nicInput"
                placeholder="Local Name"
                value={roomBoyForm.hk_name_local_language || ""}
                onChange={(e) =>
                  setRoomBoyForm({
                    ...roomBoyForm,
                    hk_name_local_language: e.target.value,
                  })
                }
              />

              <input
                className="nicInput"
                placeholder="Contact *"
                value={roomBoyForm.hk_contact}
                onChange={(e) =>
                  setRoomBoyForm({ ...roomBoyForm, hk_contact: e.target.value })
                }
              />

              <input
                className="nicInput"
                placeholder="Alternate Contact"
                value={roomBoyForm.hk_alternate_contact || ""}
                onChange={(e) =>
                  setRoomBoyForm({
                    ...roomBoyForm,
                    hk_alternate_contact: e.target.value,
                  })
                }
              />

              <select
                className="nicInput"
                value={roomBoyForm.shift}
                onChange={(e) =>
                  setRoomBoyForm({ ...roomBoyForm, shift: e.target.value as "Morning" | "Evening" | "Night" | "Full-Day" })
                }
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
                <option value="Full-Day">Full-Day</option>
              </select>

              <textarea
                className="nicInput"
                placeholder="Address"
                rows={3}
                value={roomBoyForm.address || ""}
                onChange={(e) =>
                  setRoomBoyForm({ ...roomBoyForm, address: e.target.value })
                }
              />
            </div>

            <div className="modalActions">
              <button
                className="linkBtn"
                onClick={() => {
                  setShowAddRoomBoy(false);
                  resetRoomBoyForm();
                }}
              >
                Cancel
              </button>
              <button className="primaryBtn" onClick={handleAddRoomBoy}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT ROOM BOY MODAL ================= */}
      {showEditRoomBoy && selectedRoomBoy && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Edit Room Boy</h3>

            <div className="space-y-4">
              <input
                className="nicInput"
                value={roomBoyForm.hk_name}
                onChange={(e) =>
                  setRoomBoyForm({ ...roomBoyForm, hk_name: e.target.value })
                }
              />

              <input
                className="nicInput"
                value={roomBoyForm.hk_name_local_language || ""}
                onChange={(e) =>
                  setRoomBoyForm({
                    ...roomBoyForm,
                    hk_name_local_language: e.target.value,
                  })
                }
              />

              <input
                className="nicInput"
                value={roomBoyForm.hk_contact}
                onChange={(e) =>
                  setRoomBoyForm({ ...roomBoyForm, hk_contact: e.target.value })
                }
              />

              <input
                className="nicInput"
                value={roomBoyForm.hk_alternate_contact || ""}
                onChange={(e) =>
                  setRoomBoyForm({
                    ...roomBoyForm,
                    hk_alternate_contact: e.target.value,
                  })
                }
              />

              <select
                className="nicInput"
                value={roomBoyForm.shift}
                onChange={(e) =>
                  setRoomBoyForm({ ...roomBoyForm, shift: e.target.value as "Morning" | "Evening" | "Night" | "Full-Day" })
                }
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
                <option value="Full-Day">Full-Day</option>
              </select>

              <textarea
                className="nicInput"
                rows={3}
                value={roomBoyForm.address || ""}
                onChange={(e) =>
                  setRoomBoyForm({ ...roomBoyForm, address: e.target.value })
                }
              />
            </div>

            <div className="modalActions">
              <button
                className="linkBtn"
                onClick={() => setShowEditRoomBoy(false)}
              >
                Cancel
              </button>
              <button className="primaryBtn" onClick={handleEditRoomBoy}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {showDeleteRoomBoyConfirm && selectedRoomBoy && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <strong>{selectedRoomBoy.hk_name}</strong>?
            </p>

            <div className="modalActions">
              <button
                className="linkBtn"
                onClick={() => setShowDeleteRoomBoyConfirm(false)}
              >
                Cancel
              </button>
              <button className="primaryBtn" onClick={handleDeleteRoomBoy}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default RoomManagement;