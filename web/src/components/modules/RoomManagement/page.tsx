'use client';

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import api from "../../../api/apiClient";
import "./RoomManagement.css";

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

type RoomBoy = {
  id: number;
  name: string;
};

type EnumValue = {
  enum_value: string;
};

export function RoomManagement() {
  /* ================= STATE ================= */

  const [rooms, setRooms] = useState<RoomOverviewBackend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------------- ASSIGN ROOM BOY ---------------- */
  const [isRoomBoyModalOpen, setIsRoomBoyModalOpen] = useState(false);
  const [roomBoys, setRoomBoys] = useState<RoomBoy[]>([]);
  const [hkShifts, setHkShifts] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [activeRoom, setActiveRoom] =
    useState<RoomOverviewBackend | null>(null);

  const [roomBoyForm, setRoomBoyForm] = useState({
    roomBoyId: "",
    shift: "",
    taskDate: "",
    remarks: "",
  });

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const res = await api.get("/rooms/overview"); // backend endpoint
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to load rooms", err);
    }
  }

  async function loadRoomBoysAndShifts() {
    const [boysRes, shiftRes] = await Promise.all([
      api.get("/room-boys"),
      api.get("/enums/hk_shift_enum"),
    ]);

    setRoomBoys(boysRes.data);
    setHkShifts(shiftRes.data.map((e: EnumValue) => e.enum_value));
  }

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
    setRoomBoyForm({
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

    const { roomBoyId, shift, taskDate } = roomBoyForm;

    if (!roomBoyId || !shift || !taskDate) {
      alert("Room boy, shift, and task date are required.");
      return;
    }

    setAssigning(true);

    try {
      await api.post("/room-boy-assignments", {
        room_id: activeRoom.room_id,
        room_boy_id: roomBoyId,
        shift,
        task_date: taskDate,
        remarks: roomBoyForm.remarks || null,
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

      {/* TABLE */}
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
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No rooms found
                </td>
              </tr>
            ) : (
              filteredRooms.map((room, idx) => (
                <tr
                  key={room.room_id}
                  className={idx % 2 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="px-4 py-3 border-t">
                    {room.room_no}
                  </td>
                  <td className="px-4 py-3 border-t">
                    {room.room_name || "—"}
                  </td>
                  <td className="px-4 py-3 border-t">
                    {room.status}
                  </td>
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
                  value={roomBoyForm.roomBoyId}
                  onChange={(e) =>
                    setRoomBoyForm({
                      ...roomBoyForm,
                      roomBoyId: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  {roomBoys.map((rb) => (
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
                  value={roomBoyForm.shift}
                  onChange={(e) =>
                    setRoomBoyForm({
                      ...roomBoyForm,
                      shift: e.target.value,
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
                  value={roomBoyForm.taskDate}
                  onChange={(e) =>
                    setRoomBoyForm({
                      ...roomBoyForm,
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
                  value={roomBoyForm.remarks}
                  onChange={(e) =>
                    setRoomBoyForm({
                      ...roomBoyForm,
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

    </div>
  );
}
export default RoomManagement;