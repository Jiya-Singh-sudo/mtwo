'use client';
import { useState, useEffect } from "react";
import { Search, Plus, Loader2, Eye, FileEdit, UserPlus, UserMinus, User } from 'lucide-react';
import "./RoomManagement.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { getActiveHousekeeping, createHousekeeping, updateHousekeeping, softDeleteHousekeeping } from "../../../api/housekeeping.api";
import { getRoomBoyOptions } from "../../../api/housekeeping.api";
import { Button } from "../../ui/button";
import type { Housekeeping, HousekeepingCreateDto, HousekeepingUpdateDto } from "../../../types/housekeeping";
import { HK_SHIFTS } from "../../../constants/housekeeping";
import { assignRoomBoyToRoom, unassignRoomBoy } from "../../../api/guestHousekeeping.api";
type ShiftType = "Morning" | "Evening" | "Night" | "Full-Day";
import { createRoom } from "../../../api/rooms.api";
import { createGuestRoom, updateGuestRoom } from "../../../api/guestRoom.api";
import { getRoomManagementOverview, updateFullRoom } from "../../../api/roomManagement.api";
import { RoomRow, EditRoomFullPayload } from "@/types/roomManagement";
import { getAssignableGuests } from "../../../api/roomManagement.api";
import { ActiveGuestRow } from "@/types/guests";

/* ================= BACKEND-MATCHING TYPES ================= */
/* Matches DB / API response (snake_case, flat structure) */
type RoomFormState = {
  room_no: string;
  room_name: string;
  residence_type: string;
  building_name: string;
  room_type: string;
  room_capacity: number;
  room_category: string;
  status: "Available" | "Occupied";
};
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
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [roomStats, setRoomStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    withGuest: 0,
    withHousekeeping: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  /* ---------------- ASSIGN ROOM BOY ---------------- */
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isRoomBoyModalOpen, setIsRoomBoyModalOpen] = useState(false);
  const [guestOptions, setGuestOptions] = useState<ActiveGuestRow[]>([]);
  const [assignCheckInDate, setAssignCheckInDate] = useState<string>("");
  const [assignCheckOutDate, setAssignCheckOutDate] = useState<string>("");
  const [hkShifts, setHkShifts] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [roomBoyOptions, setRoomBoyOptions] = useState<RoomBoyOption[]>([]);
  const [viewRoom, setViewRoom] = useState<RoomRow | null>(null);
  const [editRoom, setEditRoom] = useState<RoomRow | null>(null);
  const [assignGuestRoom, setAssignGuestRoom] = useState<RoomRow | null>(null);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomForm, setRoomForm] = useState<RoomFormState>({
    room_no: "",
    room_name: "",
    residence_type: "",
    building_name: "",
    room_type: "",
    room_capacity: 1,
    room_category: "",
    status: "Available",
  });



  const [activeRoom, setActiveRoom] = useState<RoomRow | null>(null);

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
  async function loadAssignableGuests() {
    try {
      const data = await getAssignableGuests();
      setGuestOptions(data);
    } catch (err) {
      console.error("Failed to load assignable guests", err);
    }
  }

  useEffect(() => {
    loadAssignableGuests();
  }, []);

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const data = await getRoomManagementOverview();
      setRooms(data);

      // Compute stats from loaded rooms
      const stats = {
        total: data.length,
        available: 0,
        occupied: 0,
        withGuest: 0,
        withHousekeeping: 0,
      };

      data.forEach((r: RoomRow) => {
        if (r.status === "Available") stats.available++;
        if (r.status === "Occupied") stats.occupied++;
        if (r.guest) stats.withGuest++;
        if (r.housekeeping) stats.withHousekeeping++;
      });

      setRoomStats(stats);
    } catch (err) {
      console.error("Failed to load room overview", err);
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

  async function handleAddRoom() {
    await createRoom(roomForm);
    setShowAddRoom(false);
    loadRooms(); // reload list
  }

  async function handleEditRoom() {
    if (!editRoom) return;

    const payload: EditRoomFullPayload = {
      // ROOM
      room_no: editRoom.roomNo,
      room_name: editRoom.roomName ?? undefined,
      building_name: editRoom.buildingName ?? undefined,
      residence_type: editRoom.residenceType ?? undefined,
      room_type: editRoom.roomType ?? undefined,
      room_category: editRoom.roomCategory ?? undefined,
      room_capacity: editRoom.roomCapacity ?? undefined,
      status: editRoom.status,

      // GUEST (optional)
      guest_id: editRoom.guest?.guestId ?? null,
      action_type: "Room-Changed",
      action_description: "Updated from Room Management",

      // HOUSEKEEPING (optional)
      hk_id: editRoom.housekeeping?.hkId ?? null,
      task_date: editRoom.housekeeping?.taskDate ?? undefined,
      task_shift: editRoom.housekeeping?.taskShift ?? undefined,
      service_type: "Room Cleaning",
    };

    await updateFullRoom(editRoom.roomId, payload);

    setEditRoom(null);
    await loadRooms();
  }


  /* ================= FILTER ================= */
  const filteredRooms = rooms.filter((room) =>
    room.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.roomName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.residenceType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.guest?.guestName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function submitAssignGuest() {
    if (!assignGuestRoom || selectedGuestId === null) return;
    await createGuestRoom({
      guest_id: selectedGuestId,
      room_id: assignGuestRoom.roomId,
      check_in_date: assignCheckInDate,
      check_out_date: assignCheckOutDate || undefined,
      action_type: "Room-Allocated",
      action_description: "Assigned from Room Management",
    });
    setAssignGuestRoom(null);
    await Promise.all([
      loadRooms(),              // refresh rooms
      loadAssignableGuests(),   // 🔥 refresh dropdown source
    ]);
  }



  /* ================= OPEN ASSIGN MODAL ================= */
  async function openAssignRoomBoyModal(room: RoomRow) {
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
        room_id: activeRoom.roomId,
        hk_id: assignmentForm.roomBoyId,
        task_date: assignmentForm.taskDate,
        task_shift: assignmentForm.shift as ShiftType,
        service_type: "Room Cleaning",
        admin_instructions: assignmentForm.remarks || undefined,
      });


      alert("Room boy assigned successfully");
      await loadRooms();
      setIsRoomBoyModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to assign room boy");
    } finally {
      setAssigning(false);
    }
  }

  async function vacateGuest(guestRoomId: string) {
    await updateGuestRoom(guestRoomId, {
      action_type: "Room-Released",
      is_active: false,
    });
    await Promise.all([
      loadRooms(),              // refresh rooms
      loadAssignableGuests(),   // 🔥 refresh dropdown source
    ]);
  }

  function openAssignGuest(room: RoomRow) {
    setAssignGuestRoom(room);
    setSelectedGuestId("");
    setAssignCheckInDate("");
    setAssignCheckOutDate("");
  }
  async function unassignHousekeeping(guestHkId: string) {
    await unassignRoomBoy(guestHkId);
    await loadRooms(); // 🔥 THIS is what you were missing
  }
  function toDateOnly(value?: string) {
    if (!value) return "";
    return value.slice(0, 10);
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

      {/* ================= ROOM STATS GRID ================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="statCard">
          <p className="statLabel">Total Rooms</p>
          <p className="statValue">{roomStats.total}</p>
        </div>

        <div className="statCard bg-green-50">
          <p className="statLabel">Available</p>
          <p className="statValue">{roomStats.available}</p>
        </div>

        <div className="statCard bg-red-50">
          <p className="statLabel">Occupied</p>
          <p className="statValue">{roomStats.occupied}</p>
        </div>

        <div className="statCard bg-blue-50">
          <p className="statLabel">Guest Assigned</p>
          <p className="statValue">{roomStats.withGuest}</p>
        </div>

        <div className="statCard bg-yellow-50">
          <p className="statLabel">Housekeeping</p>
          <p className="statValue">{roomStats.withHousekeeping}</p>
        </div>
      </div>

      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="roomBoys">Room Boys</TabsTrigger>
        </TabsList>

        {/* ---------------- ROOMS TAB ---------------- */}
        <TabsContent value="rooms" className="space-y-6">
          {/* SEARCH */}
          <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
            {/* SEARCH */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                placeholder="Search room, guest, residence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* ADD ROOM BUTTON */}
            <Button
              className="bg-[#00247D] text-white whitespace-nowrap"
              onClick={() => setShowAddRoom(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
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
                      key={room.roomId}
                      className={idx % 2 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="px-4 py-3 border-t">{room.roomNo}</td>
                      <td className="px-4 py-3 border-t">
                        {room.roomName || "—"}
                      </td>
                      <td className="px-4 py-3 border-t">{room.status}</td>
                      <td className="px-4 py-3 border-t">
                        {room.guest?.guestName || "—"}
                      </td>
                      <td className="space-x-2">
                        <button
                          onClick={() => setViewRoom(room)}
                          className="inline-flex items-center gap-1">
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditRoom(room)}
                          className="inline-flex items-center gap-1">
                          <FileEdit size={16} />
                        </button>
                        {room.guest ? (
                          <button
                            onClick={() => vacateGuest(room.guest!.guestRoomId)}
                            className="inline-flex items-center gap-1">
                            <UserMinus size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => openAssignGuest(room)}
                            className="inline-flex items-center gap-1">
                            <UserPlus size={16} />
                          </button>
                        )}
                        {room.housekeeping ? (
                          <button
                            onClick={() => unassignHousekeeping(room.housekeeping!.guestHkId)}
                            className="inline-flex items-center gap-1">
                            <UserMinus size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => openAssignRoomBoyModal(room)}
                            className="inline-flex items-center gap-1">
                            <User size={16} />
                          </button>
                        )}
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
                  value={activeRoom.roomNo}
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

      {editRoom && (
        <div className="modalOverlay">
          <div className="nicModal">

            <div className="nicModalHeader">
              <h2>Edit Room</h2>
              <button className="closeBtn" onClick={() => setEditRoom(null)}>
                ✕
              </button>
            </div>

            <div className="nicFormGrid">

              {/* Room No */}
              <div>
                <label>Room Number</label>
                <input
                  className="nicInput"
                  value={editRoom.roomNo}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, roomNo: e.target.value })
                  }
                />
              </div>

              {/* Room Name */}
              <div>
                <label>Room Name</label>
                <input
                  className="nicInput"
                  value={editRoom.roomName ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, roomName: e.target.value })
                  }
                />
              </div>

              {/* Building */}
              <div>
                <label>Building Name</label>
                <input
                  className="nicInput"
                  value={editRoom.buildingName ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, buildingName: e.target.value })
                  }
                />
              </div>

              {/* Residence Type */}
              <div>
                <label>Residence Type</label>
                <input
                  className="nicInput"
                  value={editRoom.residenceType ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, residenceType: e.target.value })
                  }
                />
              </div>

              {/* Room Type */}
              <div>
                <label>Room Type</label>
                <input
                  className="nicInput"
                  value={editRoom.roomType ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, roomType: e.target.value })
                  }
                />
              </div>

              {/* Room Category */}
              <div>
                <label>Room Category</label>
                <input
                  className="nicInput"
                  value={editRoom.roomCategory ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, roomCategory: e.target.value })
                  }
                />
              </div>

              {/* Capacity */}
              <div>
                <label>Capacity</label>
                <input
                  type="number"
                  min={1}
                  className="nicInput"
                  value={editRoom.roomCapacity ?? 1}
                  onChange={(e) =>
                    setEditRoom({
                      ...editRoom,
                      roomCapacity: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Status */}
              <div>
                <label>Status</label>
                <select
                  className="nicInput"
                  value={editRoom.status}
                  onChange={(e) =>
                    setEditRoom({
                      ...editRoom,
                      status: e.target.value as "Available" | "Occupied",
                    })
                  }
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                </select>
              </div>

              {/* Guest */}
              <div className="fullWidth">
                <label>Guest</label>
                <select
                  className="nicInput"
                  value={editRoom.guest?.guestId ?? ""}
                  onChange={(e) =>
                    setEditRoom({
                      ...editRoom,
                      guest: e.target.value
                        ? guestOptions.find(g => g.guest_id.toString() === e.target.value)
                          ? {
                            guestId: e.target.value,
                            guestRoomId: editRoom.guest?.guestRoomId ?? "",
                            guestName:
                              guestOptions.find(g => g.guest_id.toString() === e.target.value)!
                                .guest_name,
                          }
                          : null
                        : null,
                    })
                  }
                >
                  <option value="">— No Guest —</option>
                  {guestOptions.map((g) => (
                    <option key={g.guest_id} value={g.guest_id}>
                      {g.guest_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Boy */}
              <div className="fullWidth">
                <label>Room Boy</label>
                <select
                  className="nicInput"
                  value={editRoom.housekeeping?.hkId ?? ""}
                  onChange={(e) =>
                    setEditRoom({
                      ...editRoom,
                      housekeeping: e.target.value
                        ? {
                          guestHkId: editRoom.housekeeping?.guestHkId ?? "",
                          hkId: e.target.value,
                          hkName:
                            roomBoyOptions.find(rb => rb.id === e.target.value)?.name || "",
                          taskDate: new Date().toISOString().slice(0, 10),
                          taskShift: "Morning",
                          isActive: true,
                        }
                        : null,
                    })
                  }
                >
                  <option value="">— Unassigned —</option>
                  {roomBoyOptions.map((rb) => (
                    <option key={rb.id} value={rb.id}>
                      {rb.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setEditRoom(null)}>
                Cancel
              </button>
              <button className="saveBtn" onClick={handleEditRoom}>
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}


      {showAddRoom && (
        <div className="modalOverlay">
          <div className="nicModal">

            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Add Room</h2>
              <button
                className="closeBtn"
                onClick={() => setShowAddRoom(false)}
              >
                ✕
              </button>
            </div>

            {/* BODY (SCROLLABLE) */}
            <div className="nicModalBody">
              <div className="nicFormStack">

                <div>
                  <label>Room Number</label>
                  <input
                    className="nicInput"
                    placeholder="e.g. GFD-101"
                    value={roomForm.room_no}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, room_no: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Room Name</label>
                  <input
                    className="nicInput"
                    placeholder="e.g. Ground Floor Double"
                    value={roomForm.room_name}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, room_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Building Name</label>
                  <input
                    className="nicInput"
                    placeholder="e.g. Jam Jalkar Bhavan"
                    value={roomForm.building_name}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, building_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Residence Type</label>
                  <input
                    className="nicInput"
                    placeholder="e.g. First Floor / Penthouse"
                    value={roomForm.residence_type}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, residence_type: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Room Type</label>
                  <input
                    className="nicInput"
                    placeholder="e.g. Single / Double / Suite"
                    value={roomForm.room_type}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, room_type: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Room Capacity</label>
                  <input
                    type="number"
                    min={1}
                    className="nicInput"
                    placeholder="Number of guests"
                    value={roomForm.room_capacity}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        room_capacity: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div>
                  <label>Room Category</label>
                  <input
                    className="nicInput"
                    placeholder="e.g. Deluxe / Standard"
                    value={roomForm.room_category}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, room_category: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Status</label>
                  <select
                    className="nicInput"
                    value={roomForm.status}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        status: e.target.value as "Available" | "Occupied",
                      })
                    }
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setShowAddRoom(false)}
              >
                Cancel
              </button>
              <button
                className="saveBtn"
                onClick={handleAddRoom}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}


      {assignGuestRoom && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Assign Guest</h3>

            <p className="mb-2">
              <b>Room:</b> {assignGuestRoom.roomNo}
            </p>

            <div className="nicFormStack">
              <div>
                <label>Guest *</label>
                <select
                  className="nicInput"
                  value={selectedGuestId ?? ""}
                  onChange={(e) => {
                    const guestId = String(e.target.value);
                    setSelectedGuestId(guestId);

                    const guest = guestOptions.find(
                      g => g.guest_id.toString() === guestId
                    );

                    setAssignCheckInDate(toDateOnly(guest?.entry_date ?? ""));
                    setAssignCheckOutDate(toDateOnly(guest?.exit_date ?? ""));
                  }}
                >
                  <option value="">Select Guest</option>
                  {guestOptions.map((g) => (
                    <option key={g.guest_id} value={g.guest_id}>
                      {g.guest_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Check-in Date</label>
                <input
                  type="date"
                  className="nicInput"
                  value={assignCheckInDate}
                  readOnly
                />
              </div>

              <div>
                <label>Check-out Date</label>
                <input
                  type="date"
                  className="nicInput"
                  value={assignCheckOutDate}
                  readOnly
                />
              </div>
            </div>

            <div className="modalActions">
              <button
                className="linkBtn"
                onClick={() => setAssignGuestRoom(null)}
              >
                Cancel
              </button>
              <button
                className="primaryBtn"
                onClick={submitAssignGuest}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW ROOM ================= */}
      {viewRoom && (
        <div className="modalOverlay">
          <div className="nicModal">

            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Room Details</h2>
              <button
                className="closeBtn"
                onClick={() => setViewRoom(null)}
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="nicModalBody">
              <div className="detailGrid">

                {/* ROOM INFO */}
                <div className="detailSection">
                  <h4>Room Information</h4>
                  <p><b>Room No:</b> {viewRoom.roomNo}</p>
                  <p><b>Room Name:</b> {viewRoom.roomName || "—"}</p>
                  <p><b>Building:</b> {viewRoom.buildingName || "—"}</p>
                  <p><b>Residence Type:</b> {viewRoom.residenceType || "—"}</p>
                  <p><b>Room Type:</b> {viewRoom.roomType || "—"}</p>
                  <p><b>Room Category:</b> {viewRoom.roomCategory || "—"}</p>
                  <p><b>Capacity:</b> {viewRoom.roomCapacity ?? "—"}</p>
                  <p><b>Status:</b> {viewRoom.status}</p>
                </div>

                {/* GUEST INFO */}
                <div className="detailSection">
                  <h4>Guest Information</h4>
                  {viewRoom.guest ? (
                    <>
                      <p><b>Guest Name:</b> {viewRoom.guest.guestName}</p>
                      <p><b>Check-In:</b> {viewRoom.guest.checkInDate || "—"}</p>
                      <p><b>Check-Out:</b> {viewRoom.guest.checkOutDate || "—"}</p>
                    </>
                  ) : (
                    <p>— No guest assigned —</p>
                  )}
                </div>

                {/* HOUSEKEEPING INFO */}
                <div className="detailSection">
                  <h4>Housekeeping</h4>
                  {viewRoom.housekeeping ? (
                    <>
                      <p><b>Room Boy:</b> {viewRoom.housekeeping.hkName}</p>
                      <p><b>Shift:</b> {viewRoom.housekeeping.taskShift}</p>
                      <p><b>Task Date:</b> {viewRoom.housekeeping.taskDate}</p>
                      <p>
                        <b>Status:</b>{" "}
                        {viewRoom.housekeeping.isActive ? "Assigned" : "Inactive"}
                      </p>
                    </>
                  ) : (
                    <p>— No room boy assigned —</p>
                  )}
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setViewRoom(null)}
              >
                Close
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