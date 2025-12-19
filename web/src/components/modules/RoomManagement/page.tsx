'use client';
import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Edit,
  BedDouble,
  Loader2,
  UserPlus,
} from "lucide-react";
import { getRoomOverview } from "../../../api/guestRoom.api";
import { RoomOverview } from "@/types/guestRoom";
import api from "../../../api/apiClient";
import "./RoomManagement.css";

/* ================= TYPES ================= */
type RoomBoy = {
  id: number;
  name: string;
};

type EnumValue = {
  enum_value: string;
};

export function RoomManagement() {
  /* ================= STATE ================= */

  const [rooms, setRooms] = useState<RoomOverview[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomOverview | null>(null);

  /* ---------------- ROOM BOY ASSIGNMENT ---------------- */
  const [isRoomBoyModalOpen, setIsRoomBoyModalOpen] = useState(false);
  const [roomBoys, setRoomBoys] = useState<RoomBoy[]>([]);
  const [hkShifts, setHkShifts] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [roomBoyForm, setRoomBoyForm] = useState({
    roomBoyId: "",
    shift: "",
    taskDate: "",
    remarks: "",
  });

  /* ================= LOADERS ================= */

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setLoading(true);
    const data = await getRoomOverview();
    setRooms(data);
    setLoading(false);
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
    room.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.residenceType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.roomName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.guest?.guestName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ================= OPEN ROOM BOY MODAL ================= */

  async function openAssignRoomBoyModal(room: RoomOverview) {
    setSelectedRoom(room);
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
    if (!selectedRoom) return;

    const { roomBoyId, shift, taskDate } = roomBoyForm;

    if (!roomBoyId || !shift || !taskDate) {
      alert("Room boy, shift, and task date are required.");
      return;
    }

    setAssigning(true);

    try {
      await api.post("/room-boy-assignments", {
        room_id: selectedRoom.roomId,
        room_boy_id: roomBoyId,
        shift,
        task_date: taskDate,
        remarks: roomBoyForm.remarks || null,
      });

      setIsRoomBoyModalOpen(false);
      alert("Room boy assigned successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to assign room boy.");
    } finally {
      setAssigning(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
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

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="animate-spin w-4 h-4" />
          Loading rooms...
        </div>
      )}

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
            {filteredRooms.map((room, idx) => (
              <tr key={room.roomId} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                <td className="px-4 py-3 border-t">{room.roomNo}</td>
                <td className="px-4 py-3 border-t">{room.roomName}</td>
                <td className="px-4 py-3 border-t">{room.status}</td>
                <td className="px-4 py-3 border-t">
                  {room.guest?.guestName || "—"}
                </td>
                <td className="px-4 py-3 border-t">
                  <button
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Assign Room Boy"
                    onClick={() => openAssignRoomBoyModal(room)}
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= ASSIGN ROOM BOY MODAL ================= */}
      {isRoomBoyModalOpen && selectedRoom && (
        <div className="modalOverlay">
          <div className="nicModal">

            <div className="nicModalHeader">
              <h2>Assign Room Boy (Housekeeping)</h2>
              <button onClick={() => setIsRoomBoyModalOpen(false)}>✕</button>
            </div>

            <div className="nicFormGrid">

              <div>
                <label>Room No</label>
                <input
                  className="nicInput"
                  value={selectedRoom.roomNo}
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
                    <option key={s} value={s}>{s}</option>
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
