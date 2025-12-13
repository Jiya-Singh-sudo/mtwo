// src/components/modules/RoomManagement/Page.tsx
'use client';
import { useState, useEffect } from "react";
import { Search, Eye, Edit, BedDouble, Loader2 } from "lucide-react";
import { getRoomOverview } from "../../../api/guestRoom.api";
import { RoomOverview } from "@/types/guestRoom";
import api from "../../../api/apiClient";
import "./RoomManagement.css";

export function RoomManagement() {
    const [activeGuests, setActiveGuests] = useState<
        { guestId: number; guestName: string }[]
    >([]);

    const [rooms, setRooms] = useState<RoomOverview[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadRooms();
        loadActiveGuests();
    }, []);

    async function loadRooms() {
        setLoading(true);
        const data = await getRoomOverview();
        setRooms(data);
        setLoading(false);
    }

    const residenceTypes = ["Jam Kiran", "Jam Chetak", "Jam Sangram", "Jam Shivneri"];
    const residenceNames = ["Duty Room", "Single Room", "Double Room"];

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRoom, setSelectedRoom] = useState<RoomOverview | null>(null);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const [newStatus, setNewStatus] = useState<string>("Available");
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [assignForm, setAssignForm] = useState({
    residenceType: "",
    residenceName: "",
    guestId: "",
    checkIn: "",
    checkOut: "",
    remarks: "",
    });


    /* -------------------------------------------------- */

    const filteredRooms = rooms.filter((room) =>
        room.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.residenceType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.roomName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.guest?.guestName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    function getStatusColor(status: string) {
        switch (status) {
            case "Available": return "bg-green-100 text-green-800";
            case "Occupied": return "bg-red-100 text-red-800";
            case "Reserved": return "bg-yellow-100 text-yellow-800";
            case "Housekeeping": return "bg-blue-100 text-blue-800";
            case "Maintenance": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    }

    /* ---------------- VACATE ROOM ---------------- */
    async function handleVacateRoom(room: RoomOverview) {
        if (!room.guestRoomId) return;

        const confirmed = window.confirm(`Vacate room ${room.roomNo}?`);
        if (!confirmed) return;

        try {
            await api.patch(`/guest-room/${room.guestRoomId}/vacate`);
            await loadRooms();
        } catch (err) {
            console.error(err);
            alert("Failed to vacate room");
        }
    }

    /* ---------------- ACTIVE GUESTS ---------------- */ 
    async function loadActiveGuests() {
    const res = await api.get("/guest-inout/active");
    console.log("ACTIVE GUEST API RAW:", res.data);
    setActiveGuests(
        res.data.map((g: any) => ({
        guestId: g.guest_id,
        guestName: g.guest_name,
        }))
    );
    }


    /* ---------------- OPEN MODALS ---------------- */

    function openDetailsModal(room: RoomOverview) {
        setSelectedRoom(room);
        setIsDetailsModalOpen(true);
    }

    function openStatusModal(room: RoomOverview) {
        setSelectedRoom(room);
        setNewStatus(room.status);
        setIsStatusModalOpen(true);
    }

    function openAssignRoomModal(room: RoomOverview) {
        setSelectedRoom(room);
        setAssignForm({
            residenceType: room.residenceType || "",
            residenceName: room.roomName || "",
            guestId: "",
            // guestName: "",
            checkIn: "",
            checkOut: "",
            remarks: "",
        });
        loadActiveGuests();
        setIsAssignModalOpen(true);
    }

    /* ---------------- ACTIONS ---------------- */
    async function handleChangeStatus() {
        if (!selectedRoom) return;

        setIsUpdatingStatus(true);

        try {
            await api.put(`/rooms/${selectedRoom.roomNo}`, {
                status: newStatus,
            });

            setIsStatusModalOpen(false);
            await loadRooms(); // 🔁 backend enforces vacate if needed
        } catch (err) {
            console.error(err);
            alert("Failed to update room status");
        } finally {
            setIsUpdatingStatus(false);
        }
    }


    /* ---------------- SUBMIT ---------------- */
    async function submitAssignRoom() {
        if (activeGuests.length === 0) {
            alert("No active guests available to assign.");
            return;
        }

        if (!selectedRoom) return;

        if (!assignForm.guestId || !assignForm.checkIn) {
            alert("Guest name and check-in date are required.");
            return;
        }

        try {
            await api.post("/guest-room", {
                room_id: selectedRoom.roomId,
                guest_id: assignForm.guestId, // this should be guest_id, not name
                check_in_date: assignForm.checkIn,
                check_out_date: assignForm.checkOut || null,
                remarks: assignForm.remarks || null,
            });

            setIsAssignModalOpen(false);
            await loadRooms(); // 🔁 reload truth
        } catch (err) {
            console.error(err);
            alert("Failed to assign room");
        }
    }


    /* ---------------- UI ---------------- */

    return (
        <div className="space-y-6">

            {/* PAGE HEADER */}
            <div>
                <h2 className="text-[#00247D] font-semibold text-xl">Room Management</h2>
                <p className="text-gray-600 text-sm">Manage room status and allocations | कक्ष प्रबंधन</p>
            </div>

            {/* SEARCH */}
            <div className="bg-white border rounded-sm p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        className="pl-10 pr-3 py-2 w-full border rounded-sm"
                        placeholder="Search by room, residence type, guest..."
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
                    <thead className="bg-[#F5A623] text-white font-medium text-sm">
                        <tr>
                            <th className="px-4 py-3 text-left">Room No</th>
                            <th className="px-4 py-3 text-left">Residence Type</th>
                            <th className="px-4 py-3 text-left">Residence Name</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Guest</th>
                            <th className="px-4 py-3 text-left">Capacity</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredRooms.map((room, idx) => (
                            <tr key={room.roomId} className={idx % 2 ? "bg-gray-50" : "bg-white"}>

                                <td className="px-4 py-3 border-t">{room.roomNo}</td>
                                <td className="px-4 py-3 border-t">{room.residenceType}</td>
                                <td className="px-4 py-3 border-t">{room.roomName}</td>

                                <td className="px-4 py-3 border-t">
                                    <span className={`px-2 py-1 rounded-sm text-xs ${getStatusColor(room.status)}`}>
                                        {room.status}
                                    </span>
                                </td>

                                <td className="px-4 py-3 border-t">{room.guest?.guestName}</td>
                                <td className="px-4 py-3 border-t">{room.capacity} Persons</td>

                                <td className="px-4 py-3 border-t">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openDetailsModal(room)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openStatusModal(room)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => openAssignRoomModal(room)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" 
                                        // disabled={activeGuests.length === 0}
                                        >
                                            <BedDouble className="w-4 h-4" />
                                        </button>
                                        {room.status === "Occupied" && room.guestRoomId && (
                                            <button
                                                onClick={() => handleVacateRoom(room)}
                                                className="text-red-600">
                                                Vacate
                                            </button>
                                        )}
                                    </div>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ---------------------- DETAILS MODAL ---------------------- */}

            {isDetailsModalOpen && selectedRoom && (
                <div className="modalOverlay">
                    <div className="nicModal">

                        <div className="nicModalHeader">
                            <h2>Room Details</h2>
                            <button className="closeBtn" onClick={() => setIsDetailsModalOpen(false)}>✕</button>
                        </div>

                        <div className="py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>Room No:</strong> {selectedRoom.roomNo}</p>
                                <p><strong>Residence Type:</strong> {selectedRoom.residenceType}</p>
                                <p><strong>Residence Name:</strong> {selectedRoom.roomName}</p>
                                <p><strong>Status:</strong> {selectedRoom.status}</p>
                                <p><strong>Guest:</strong> {selectedRoom.guest?.guestName}</p>
                                <p><strong>Capacity:</strong> {selectedRoom.capacity}</p>
                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button className="cancelBtn" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
                        </div>

                    </div>
                </div>
            )}

            {/* ---------------------- STATUS MODAL ---------------------- */}

            {isStatusModalOpen && selectedRoom && (
                <div className="modalOverlay">
                    <div className="nicModal">

                        <div className="nicModalHeader">
                            <h2>Change Room Status</h2>
                            <button className="closeBtn" onClick={() => setIsStatusModalOpen(false)}>✕</button>
                        </div>

                        <div className="py-4 space-y-4">
                            <p>Room: {selectedRoom.roomNo}</p>

                            <select
                                className="nicInput"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <option value="Available">Available</option>
                                <option value="Occupied">Occupied</option>
                                <option value="Reserved">Reserved</option>
                                <option value="Housekeeping">Housekeeping</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>

                        <div className="nicModalActions">
                            <button className="cancelBtn" onClick={() => setIsStatusModalOpen(false)}>Cancel</button>
                            <button className="saveBtn" onClick={handleChangeStatus} disabled={isUpdatingStatus}>
                                {isUpdatingStatus ? <Loader2 className="animate-spin w-4 h-4" /> : "Update"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ---------------------- ASSIGN ROOM MODAL ---------------------- */}

            {isAssignModalOpen && selectedRoom && (
                <div className="modalOverlay">
                    <div className="nicModal">

                        <div className="nicModalHeader">
                            <h2>Assign Room</h2>
                            <button className="closeBtn" onClick={() => setIsAssignModalOpen(false)}>✕</button>
                        </div>

                        <div className="nicFormGrid">

                            <div>
                                <label>Room Number</label>
                                <input className="nicInput" value={selectedRoom.roomNo} readOnly />
                            </div>

                            <div>
                                <label>Residence Type</label>
                                <select
                                    className="nicInput"
                                    value={assignForm.residenceType}
                                    onChange={(e) => setAssignForm({ ...assignForm, residenceType: e.target.value })}
                                >
                                    {residenceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label>Residence Name</label>
                                <select
                                    className="nicInput"
                                    value={assignForm.residenceName}
                                    onChange={(e) => setAssignForm({ ...assignForm, residenceName: e.target.value })}
                                >
                                    {residenceNames.map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>

                            <div>
                                <label>Guest Name *</label>
                                <select
                                    className="nicInput"
                                    value={assignForm.guestId}
                                    onChange={(e) =>
                                        setAssignForm({ ...assignForm, guestId: e.target.value })
                                    }
                                    >
                                    <option value="">Select Guest</option>

                                    {activeGuests.map((g) => (
                                        <option key={g.guestId} value={g.guestId}>
                                        {g.guestName}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            <div>
                                <label>Check-in Date *</label>
                                <input
                                    type="date"
                                    className="nicInput"
                                    value={assignForm.checkIn}
                                    onChange={(e) => setAssignForm({ ...assignForm, checkIn: e.target.value })}
                                />
                            </div>

                            <div>
                                <label>Check-out Date</label>
                                <input
                                    type="date"
                                    className="nicInput"
                                    value={assignForm.checkOut}
                                    onChange={(e) => setAssignForm({ ...assignForm, checkOut: e.target.value })}
                                />
                            </div>

                            <div className="fullWidth">
                                <label>Remarks</label>
                                <textarea
                                    className="nicInput"
                                    rows={3}
                                    value={assignForm.remarks}
                                    onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
                                />
                            </div>

                        </div>
                        {activeGuests.length === 0 && (
                            <p className="text-sm text-red-600">
                                No active guests available. Please check-in a guest before assigning a room.
                            </p>
                        )}

                        <div className="nicModalActions">
                            <button className="cancelBtn" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
                            <button className="saveBtn" onClick={submitAssignRoom} disabled={activeGuests.length === 0}>Assign Room</button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
export default RoomManagement;