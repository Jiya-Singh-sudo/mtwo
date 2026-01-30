'use client';
import { useState, useEffect } from "react";
import { Search, Plus, Loader2, Eye, Edit, XCircle, User, Trash2, Layers, CheckCircle, UserCheck, UserCog, X } from 'lucide-react';
import { StatCard } from "@/components/ui/StatCard";
import "./RoomManagement.css";
import { ZodError } from "zod";
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
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { roomCreateEditSchema } from "@/validation/roomManagement.validation";
import { housekeepingCreateEditSchema } from "@/validation/roomManagement.validation";
// import { guestRoomAssignSchema } from "@/validation/roomManagement.validation";
import { roomBoyAssignmentSchema } from "@/validation/roomManagement.validation";
import { formatDate } from "@/utils/dateTime";

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
  const roomTable = useTableQuery({
    sortBy: 'room_no',
    sortOrder: 'asc',
  });
  const hkTable = useTableQuery({
    sortBy: 'hk_name',
    sortOrder: 'asc',
    limit: 10,
  });

  /* ================= STATE ================= */
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [roomStats, setRoomStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    withGuest: 0,
    withHousekeeping: 0,
  });
  type RoomCardFilter =
    | "ALL"
    | "AVAILABLE"
    | "OCCUPIED"
    | "WITH_GUEST"
    | "WITH_HOUSEKEEPING";

  const [activeCard, setActiveCard] = useState<RoomCardFilter>("ALL");
  const [activeTab, setActiveTab] = useState<"rooms" | "roomBoys">("rooms");

  // const [searchQuery, setSearchQuery] = useState("");
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeRoom, setActiveRoom] = useState<RoomRow | null>(null);
  // const [roomErrors, setRoomErrors] = useState<Record<string, string>>({});
  // const [roomBoyErrors, setRoomBoyErrors] = useState<Record<string, string>>({});
  // const [assignmentErrors, setAssignmentErrors] = useState<Record<string, string>>({});
  // Assignment form (for assigning room boy to a room)
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormType>({
    roomBoyId: "",
    shift: "",
    taskDate: "",
    remarks: "",
  });

  // Room boys management
  const [roomBoys, setRoomBoys] = useState<Housekeeping[]>([]);

  const [selectedRoomBoy, setSelectedRoomBoy] = useState<Housekeeping | null>(null);

  // Modals
  const [viewRoomBoy, setViewRoomBoy] = useState<Housekeeping | null>(null);
  const [showAddRoomBoy, setShowAddRoomBoy] = useState(false);
  const [showEditRoomBoy, setShowEditRoomBoy] = useState(false);
  const [showDeleteRoomBoyConfirm, setShowDeleteRoomBoyConfirm] = useState(false);
  const [deleteRoomBoyError, setDeleteRoomBoyError] = useState<string | null>(null);

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
    roomTable.setLoading(true);
    loadRooms();
  }, [
    roomTable.query.page,
    roomTable.query.limit,
    roomTable.query.search,
    roomTable.query.sortBy,
    roomTable.query.sortOrder,
    roomTable.query.status,
    roomTable.query.entryDateFrom,
    roomTable.query.entryDateTo,
  ]);

  // useEffect(() => {
  //   roomTable.setSort("room_no", "asc");
  // }, []);

  // useEffect(() => {
  //   hkTable.setLoading(true);
  //   loadRoomBoys();
  // }, []);

  async function loadRooms() {
    try {
      const res = await getRoomManagementOverview({
        page: roomTable.query.page,
        limit: roomTable.query.limit,
        search: roomTable.query.search,
        sortBy: roomTable.query.sortBy,
        sortOrder: roomTable.query.sortOrder,
        status: roomTable.query.status === "Available" || roomTable.query.status === "Occupied" ? roomTable.query.status : undefined,
        entryDateFrom: roomTable.query.entryDateFrom,
        entryDateTo: roomTable.query.entryDateTo,
      });

      setRooms(res.data);
      roomTable.setTotal(res.totalCount);
      setRoomStats(res.stats);

    } finally {
      roomTable.setLoading(false);
    }
  }

  async function loadRoomBoys() {
    try {
      const res = await getActiveHousekeeping({
        page: hkTable.query.page,
        limit: hkTable.query.limit,
        search: hkTable.query.search,
        sortBy: hkTable.query.sortBy,
        sortOrder: hkTable.query.sortOrder,
      });

      setRoomBoys(res.data);
      hkTable.setTotal(res.totalCount);
    } finally {
      hkTable.setLoading(false);
    }
  }

  // async function loadRooms() {
  //   try {
  //     const data = await getRoomManagementOverview();
  //     setRooms(data);

  //     // Compute stats from loaded rooms
  //     const stats = {
  //       total: data.length,
  //       available: 0,
  //       occupied: 0,
  //       withGuest: 0,
  //       withHousekeeping: 0,
  //     };

  //     data.forEach((r: RoomRow) => {
  //       if (r.status === "Available") stats.available++;
  //       if (r.status === "Occupied") stats.occupied++;
  //       if (r.guest) stats.withGuest++;
  //       if (r.housekeeping) stats.withHousekeeping++;
  //     });

  //     setRoomStats(stats);
  //   } catch (err) {
  //     console.error("Failed to load room overview", err);
  //   }
  // }

  async function loadRoomBoysAndShifts() {
    try {
      const boys = await getRoomBoyOptions();

      setRoomBoyOptions(
        boys.map((b: Housekeeping) => ({
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
    hkTable.setLoading(true);
    loadRoomBoys();
  }, [
    hkTable.query.page,
    hkTable.query.limit,
    hkTable.query.search,
    hkTable.query.sortBy,
    hkTable.query.sortOrder,
  ]);

  async function handleAddRoom() {
    setFormErrors({});

    try {
      // ✅ Validate ONLY room creation fields
      const parsed = roomCreateEditSchema.parse(roomForm);

      // ✅ parsed already matches RoomCreateDto exactly
      await createRoom(parsed);

      setShowAddRoom(false);
      await loadRooms();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};

        err.issues.forEach((issue) => {
          errors[issue.path.join(".")] = issue.message;
        });

        setFormErrors(errors);
      }
    }
  }


  async function handleEditRoom() {
    if (!editRoom) return;
    try{
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
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach(i => {
          errors[i.path.join(".")] = i.message;
        });
        setFormErrors(errors);
        return;
      }
    }
  }


  /* ================= FILTER ================= */
  // const filteredRooms = rooms.filter((room) =>
  //   room.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (room.roomName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (room.residenceType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   (room.guest?.guestName || "").toLowerCase().includes(searchQuery.toLowerCase())
  // );

  async function submitAssignGuest() {
    if (!assignGuestRoom || selectedGuestId === null) return;

    try{
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
    catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {};
      err.issues.forEach(i => {
        errors[i.path.join(".")] = i.message;
      });
      setFormErrors(errors);
      return;
    }
    }
    }

  /* ================= OPEN ASSIGN MODAL ================= */
  async function openAssignRoomBoyModal(room: RoomRow) {
    resetFormErrors();
    try{
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
    catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {};
      err.issues.forEach(i => {
        errors[i.path.join(".")] = i.message;
      });
      setFormErrors(errors);
      return;
    }
    }
    }

  /* ================= SUBMIT ================= */
  async function submitRoomBoyAssignment() {
    if (!activeRoom) return;

    setFormErrors({});

    try {
      const parsed = roomBoyAssignmentSchema.parse({
        room_boy_id: assignmentForm.roomBoyId,
        assignment_start_date: assignmentForm.taskDate,
        shift: assignmentForm.shift,
        remarks: assignmentForm.remarks,
      });

      // 🔒 Hard guarantee for TS + runtime
      if (!parsed.room_boy_id || !parsed.assignment_start_date) {
        throw new Error("Required assignment fields missing");
      }

      setAssigning(true);

      await assignRoomBoyToRoom({
        room_id: activeRoom.roomId,
        hk_id: parsed.room_boy_id,
        task_date: parsed.assignment_start_date,
        task_shift: parsed.shift as ShiftType,
        service_type: "Room Cleaning",
        admin_instructions: parsed.remarks || undefined,
      });

      setIsRoomBoyModalOpen(false);
      await loadRooms();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach(i => {
          errors[i.path.join(".")] = i.message;
        });
        setFormErrors(errors);
      }
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

    // } catch (err) {
    //   if (err instanceof ZodError) {
    //     const errors: Record<string, string> = {};
    //     err.issues.forEach(i => {
    //       errors[i.path.join(".")] = i.message;
    //     });
    //     setFormErrors(errors);
    //     return;
    //   }
    // }
  }

  function openAssignGuest(room: RoomRow) {
    try{
    setAssignGuestRoom(room);
    setSelectedGuestId("");
    setAssignCheckInDate("");
    setAssignCheckOutDate("");
    }
    catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach(i => {
          errors[i.path.join(".")] = i.message;
        });
        setFormErrors(errors);
        return;
      }
    }
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

  // const handleDeleteRoomBoy = async () => {
  //   if (!selectedRoomBoy) return;

  //   await softDeleteHousekeeping(selectedRoomBoy.hk_name);

  //   setRoomBoys((prev) =>
  //     prev.filter((rb) => rb.hk_id !== selectedRoomBoy.hk_id)
  //   );

  //   setShowDeleteRoomBoyConfirm(false);
  // };
  const handleDeleteRoomBoy = async () => {
    if (!selectedRoomBoy) return;

    // 🔴 clear old error
    setDeleteRoomBoyError(null);

    try {
      await softDeleteHousekeeping(selectedRoomBoy.hk_name);

      // ✅ success → update UI
      setRoomBoys((prev) =>
        prev.filter((rb) => rb.hk_id !== selectedRoomBoy.hk_id)
      );

      setShowDeleteRoomBoyConfirm(false);
    } catch (err: any) {
      // ✅ extract backend message
      const message =
        err?.response?.data?.message ||
        "Unable to delete room boy";

      setDeleteRoomBoyError(message);

      // ❌ DO NOT close modal
    }
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

  function applyCardView(card: RoomCardFilter) {
    setActiveCard(card);

    roomTable.batchUpdate(prev => ({
      ...prev,
      page: 1,
      status:
        card === "AVAILABLE" ? "Available" :
          card === "OCCUPIED" ? "Occupied" :
            undefined,
      sortBy:
        card === "WITH_GUEST" ? "guest_name" :
          card === "WITH_HOUSEKEEPING" ? "hk_name" :
            "room_no",
      sortOrder: "asc",
    }));
  }

  function validateField(
    schema: any,
    field: string,
    value: any,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) {
    try {
      schema.pick({ [field]: true }).parse({ [field]: value });

      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } catch (err) {
      if (err instanceof ZodError) {
        setErrors(prev => ({
          ...prev,
          [field]: err.issues[0]?.message,
        }));
      }
    }
  }
function resetFormErrors() {
  setFormErrors({});
}

function resetAssignRoomBoyState() {
  setAssignmentForm({
    roomBoyId: "",
    shift: "",
    taskDate: "",
    remarks: "",
  });
  setActiveRoom(null);
  resetFormErrors();
}

function resetAssignGuestState() {
  setAssignGuestRoom(null);
  setSelectedGuestId(null);
  setAssignCheckInDate("");
  setAssignCheckOutDate("");
  resetFormErrors();
}

function resetEditRoomState() {
  setEditRoom(null);
  resetFormErrors();
}

function resetAddRoomState() {
  setShowAddRoom(false);
  setRoomForm({
    room_no: "",
    room_name: "",
    residence_type: "",
    building_name: "",
    room_type: "",
    room_capacity: 1,
    room_category: "",
    status: "Available",
  });
  resetFormErrors();
}

  const roomColumns: Column<RoomRow>[] = [
    {
      header: "Room No",
      accessor: "roomNo",
      sortable: true,
      sortKey: "room_no",
    },
    {
      header: "Residence",
      accessor: "roomName",
      sortable: true,
      sortKey: "room_name",
    },
    {
      header: "Status",
      sortable: true,
      sortKey: "status",
      render: (row) => {
        const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
        if (row.status === "Available") {
          return <span className={`${base} bg-green-100 text-green-800`}>Available</span>;
        }
        return <span className={`${base} bg-red-100 text-red-800`}>Occupied</span>;
      },
    },
    {
      header: "Guest",
      render: (row) => row.guest?.guestName || "—",
    },
    {
      header: "Room Boy",
      render: (row) => row.housekeeping?.hkName || "—",
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-3">
          {/* View */}
          <button className="icon-btn text-blue-600" title="View" onClick={() => setViewRoom(row)}>
            <Eye />
          </button>

          {/* Edit */}
          <button className="icon-btn text-green-600" title="Edit" onClick={() => setEditRoom(row)}>
            <Edit />
          </button>

          {/* Assign / Remove Guest */}
          {row.guest ? (
            <button className="icon-btn text-orange-600" title="Remove Guest" onClick={() => vacateGuest(row.guest!.guestRoomId)}>
              <XCircle />
            </button>
          ) : (
            <button className="icon-btn text-blue-600" title="Assign Guest" onClick={() => openAssignGuest(row)}>
              <Plus />
            </button>
          )}

          {/* Assign / Remove Room Boy */}
          {row.housekeeping ? (
            <button className="icon-btn text-orange-600" title="Unassign Room Boy" onClick={() => {
              if (row.housekeeping?.guestHkId) {
                unassignHousekeeping(row.housekeeping.guestHkId);
              }
            }}>
              <XCircle />
            </button>
          ) : (
            <button className="icon-btn text-purple-600" title="Assign Room Boy" onClick={() => openAssignRoomBoyModal(row)}>
              <User />
            </button>
          )}
        </div>
      ),
    },
  ];

  const roomBoyColumns: Column<Housekeeping>[] = [
    {
      header: "Name",
      accessor: "hk_name",
      sortable: true,
      sortKey: "hk_name",
    },
    {
      header: "Local Name",
      accessor: "hk_name_local_language",
      // sortable: true,
      // sortKey: "hk_name_local_language",
    },
    {
      header: "Contact",
      accessor: "hk_contact",
      sortable: true,
      sortKey: "hk_contact",
    },
    {
      header: "Alt Contact",
      render: (rb) => rb.hk_alternate_contact || "—",
      sortKey: "hk_alternate_contact",
      sortable: true,
    },
    {
      header: "Shift",
      accessor: "shift",
      sortable: true,
      sortKey: "shift",
    },
    {
      header: "Address",
      accessor: "address",
      sortable: true,
      sortKey: "address",
    },
    {
      header: "Actions",
      render: (rb) => (
        <div className="flex items-center gap-3">
          {/* View */}
          <button
            className="icon-btn text-blue-600"
            title="View"
            onClick={() => setViewRoomBoy(rb)}
          >
            <Eye />
          </button>

          {/* Edit */}
          <button
            className="icon-btn text-green-600"
            title="Edit"
            onClick={() => openEditRoomBoyModal(rb)}
          >
            <Edit />
          </button>

          {/* Delete */}
          <button
            className="icon-btn text-red-600"
            title="Delete"
            onClick={() => {
              setSelectedRoomBoy(rb);
              setShowDeleteRoomBoyConfirm(true);
            }}
          >
            <Trash2 />
          </button>
        </div>
      ),
    },
  ];


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

      {/* ================= ROOM STATS GRID =================*/}
      <div className="statsGrid">
        <StatCard
          title="All Rooms"
          value={roomStats.total}
          icon={Layers}
          variant="blue"
          active={activeCard === "ALL"}
          onClick={() => applyCardView("ALL")}
        />

        <StatCard
          title="Available"
          value={roomStats.available}
          icon={CheckCircle}
          variant="green"
          active={activeCard === "AVAILABLE"}
          onClick={() => applyCardView("AVAILABLE")}
        />

        <StatCard
          title="Occupied"
          value={roomStats.occupied}
          icon={XCircle}
          variant="orange"
          active={activeCard === "OCCUPIED"}
          onClick={() => applyCardView("OCCUPIED")}
        />

        <StatCard
          title="Guest Assigned"
          value={roomStats.withGuest}
          icon={UserCheck}
          variant="blue"
          active={activeCard === "WITH_GUEST"}
          onClick={() => applyCardView("WITH_GUEST")}
        />

        <StatCard
          title="Housekeeping"
          value={roomStats.withHousekeeping}
          icon={UserCog}
          variant="purple"
          active={activeCard === "WITH_HOUSEKEEPING"}
          onClick={() => applyCardView("WITH_HOUSEKEEPING")}
        />
      </div>

      {/* TABS */}
      <div className="nicTabs">
        <button
          className={`nicTab ${activeTab === "rooms" ? "active" : ""}`}
          onClick={() => setActiveTab("rooms")}
        >
          Rooms
        </button>
        <button
          className={`nicTab ${activeTab === "roomBoys" ? "active" : ""}`}
          onClick={() => setActiveTab("roomBoys")}
        >
          Room Boys
        </button>
      </div>

      {/* ---------------- ROOMS TAB ---------------- */}
      {activeTab === "rooms" && (
        <>
          {/* SEARCH + ADD ROOM */}
          <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                placeholder="Search room, guest, residence..."
                value={roomTable.query.search ?? ""}
                onChange={(e) => roomTable.setSearchInput(e.target.value)}
                maxLength={50}
              />
            </div>

            <Button
              className="bg-[#00247D] text-white btn-icon-text"
              onClick={() => setShowAddRoom(true)}
            >
              <Plus className="w-4 h-4" />
              Add Room
            </Button>
          </div>

          {/* ROOMS TABLE */}
          <div className="bg-white border rounded-sm overflow-hidden">
            <DataTable
              data={rooms}
              columns={roomColumns}
              keyField="roomId"
              page={roomTable.query.page}
              limit={roomTable.query.limit}
              totalCount={roomTable.total}
              sortBy={roomTable.query.sortBy}
              sortOrder={roomTable.query.sortOrder}
              loading={roomTable.loading}
              onPageChange={roomTable.setPage}
              onLimitChange={roomTable.setLimit}
              onSortChange={roomTable.setSort}
            />
          </div>
        </>
      )}

      {/* ---------------- ROOM BOYS TAB ---------------- */}
      {activeTab === "roomBoys" && (
        <>
          <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                placeholder="Search room boys..."
                value={hkTable.searchInput ?? ""}
                onChange={(e) => hkTable.setSearchInput(e.target.value)}
                maxLength={50}
              />
            </div>

            <Button
              onClick={() => {
                resetRoomBoyForm();
                setShowAddRoomBoy(true);
              }}
              className="bg-[#00247D] hover:bg-[#003399] text-white btn-icon-text"
            >
              <Plus className="w-4 h-4" />
              Add Room Boy
            </Button>
          </div>

          <div className="bg-white border rounded-sm overflow-hidden">
            <DataTable
              data={roomBoys}
              columns={roomBoyColumns}
              keyField="hk_id"
              page={hkTable.query.page}
              limit={hkTable.query.limit}
              totalCount={hkTable.total}
              sortBy={hkTable.query.sortBy}
              sortOrder={hkTable.query.sortOrder}
              loading={hkTable.loading}
              onPageChange={hkTable.setPage}
              onLimitChange={hkTable.setLimit}
              onSortChange={hkTable.setSort}
            />
          </div>
        </>
      )}

      {/* ================= ASSIGN ROOM BOY MODAL ================= */}
      {isRoomBoyModalOpen && activeRoom && (
        <div className="modalOverlay">
          <div className="nicModal">

            <div className="nicModalHeader">
              <h2>Assign Room Boy</h2>
              <button onClick={() => {setIsRoomBoyModalOpen(false);
                resetAssignRoomBoyState()}}>✕</button>
            </div>
          {Object.keys(formErrors).length > 0 && (
  <div className="alert alert-error">
    <XCircle size={18} />
    <span>Please fix the highlighted fields below.</span>
    <button onClick={() => setFormErrors({})}>
      <X size={14} />
    </button>
  </div>
)}
            <div className="nicFormGrid">

              <div>
                <label>Room No </label>
                <input
                  className="nicInput"
                  value={activeRoom.roomNo}
                  readOnly
                />
              </div>

              <div>
                <label className="nicLabel">
                  Room Boy
                  <span className="required">*</span>
                </label>
                <select
                  className="nicInput"
                  value={assignmentForm.roomBoyId}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      roomBoyId: e.target.value,
                    })
                  }
                  onBlur={() =>
                    validateField(
                      roomBoyAssignmentSchema,
                      "room_boy_id",
                      assignmentForm.roomBoyId,
                      setFormErrors
                    )
                  }
                >
                  <option value="">Select</option>
                  {roomBoyOptions.map((rb) => (
                    <option key={rb.id} value={rb.id}>
                      {rb.name}
                    </option>
                  ))}
                </select>
                {/* {formErrors.room_boy_id && (
                  // <p className="errorText">{formErrors.room_boy_id}</p>
                  
                )} */}
                {formErrors.room_boy_id && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.room_boy_id}</span>
                  </div>
                )}

              </div>

              <div>
                <label className="nicLabel">
                  Shift
                  <span className="required">*</span>
                </label>
                <select
                  className="nicInput"
                  value={assignmentForm.shift}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      shift: e.target.value as ShiftType | "",
                    })
                  }
                  onBlur={() =>
                    validateField(
                      roomBoyAssignmentSchema,
                      "shift",
                      assignmentForm.shift,
                      setFormErrors
                    )
                  }
                >
                  <option value="">Select</option>
                  {hkShifts.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {/* {formErrors.shift && (
                  <p className="errorText">{formErrors.shift}</p>
                )} */}
                {formErrors.shift && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.shift}</span>
  </div>
)}

              </div>

              <div>
                <label className="nicLabel">
                  Task Date
                  <span className="required">*</span>
                </label>
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
                  onBlur={() =>
                    validateField(
                      roomBoyAssignmentSchema,
                      "assignment_start_date",
                      assignmentForm.taskDate,
                      setFormErrors
                    )
                  }
                />
                {/* {formErrors.assignment_start_date && (
                  <p className="errorText">{formErrors.assignment_start_date}</p>
                )} */}
                {formErrors.assignment_start_date && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.assignment_start_date}</span>
  </div>
)}

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
                  maxLength={300}
                  onKeyUp={() => validateField(roomBoyAssignmentSchema, "remarks", assignmentForm.remarks, setFormErrors)}
                  onBlur={() => validateField(roomBoyAssignmentSchema, "remarks", assignmentForm.remarks, setFormErrors)}
                />
              </div>
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {setIsRoomBoyModalOpen(false);
                  resetAssignRoomBoyState()}}
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
          {Object.keys(formErrors).length > 0 && (
  <div className="alert alert-error">
    <XCircle size={18} />
    <span>Please fix the highlighted fields below.</span>
    <button onClick={() => setFormErrors({})}>
      <X size={14} />
    </button>
  </div>
)}
            <div className="nicModalHeader">
              <h2>Edit Room</h2>
              <button className="closeBtn" onClick={() => {setEditRoom(null);
                resetEditRoomState()}}>
                ✕
              </button>
            </div>

            <div className="nicFormGrid">

              {/* Room No */}
              <div>
                <label>Room Number <span className="required">*</span></label>
                <input
                  className="nicInput"
                  value={editRoom.roomNo}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, roomNo: e.target.value })
                  }
                  maxLength={20}
                  onBlur={() => validateField(roomCreateEditSchema, "room_no", editRoom.roomNo, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "room_no", editRoom.roomNo, setFormErrors)}
                />
                {/* <p className="errorText">{formErrors.room_no}</p> */}
                {formErrors.room_no && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.room_no}</span>
                  </div>
                )}

              </div>

              {/* Room Name */}
              <div>
                <label>Room Name <span className="required">*</span></label>
                <input
                  className="nicInput"
                  value={editRoom.roomName ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, roomName: e.target.value })
                  }
                  maxLength={50}
                  onBlur={() => validateField(roomCreateEditSchema, "room_name", editRoom.roomName, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "room_name", editRoom.roomName, setFormErrors)}
                />
                {/* <p className="errorText">{formErrors.room_name}</p> */}
                {formErrors.room_name && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.room_name}</span>
                  </div>
                )}

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
                  maxLength={50}
                  onBlur={() => validateField(roomCreateEditSchema, "building_name", editRoom.buildingName, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "building_name", editRoom.buildingName, setFormErrors)}
                />
                {/* <p className="errorText">{formErrors.building_name}</p> */}
                {formErrors.building_name && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.building_name}</span>
                  </div>
                )}

              </div>

              {/* Residence Type */}
              <div>
                <label>Residence Type <span className="required">*</span></label>
                <input
                  className="nicInput"
                  value={editRoom.residenceType ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, residenceType: e.target.value })
                  }
                  maxLength={70}
                  onBlur={() => validateField(roomCreateEditSchema, "residence_type", editRoom.residenceType, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "residence_type", editRoom.residenceType, setFormErrors)}
                />
                {/* <p className="errorText">{formErrors.residence_type}</p> */}
                {formErrors.residence_type && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.residence_type}</span>
                  </div>
                )}

              </div>

              {/* Room Type */}
              <div>
                <label>Room Type <span className="required">*</span></label>
                <input
                  className="nicInput"
                  value={editRoom.roomType ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, roomType: e.target.value })
                  }
                  maxLength={70}
                  onBlur={() => validateField(roomCreateEditSchema, "room_type", editRoom.roomType, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "room_type", editRoom.roomType, setFormErrors)}
                />
                {/* <p className="errorText">{formErrors.room_type}</p> */}
                {formErrors.room_type && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.room_type}</span>
                  </div>
                )}

              </div>

              {/* Room Category */}
              <div>
                <label>Room Category <span className="required">*</span></label>
                <input
                  className="nicInput"
                  value={editRoom.roomCategory ?? ""}
                  onChange={(e) =>
                    setEditRoom({ ...editRoom, roomCategory: e.target.value })
                  }
                  maxLength={70}
                  onBlur={() => validateField(roomCreateEditSchema, "room_category", editRoom.roomCategory, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "room_category", editRoom.roomCategory, setFormErrors)}
                />
                {/* <p className="errorText">{formErrors.room_category}</p> */}
                {formErrors.room_category && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.room_category}</span>
                  </div>
                )}

              </div>

              {/* Capacity */}
              <div>
                <label>Capacity <span className="required">*</span></label>
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
                  maxLength={100}
                  onBlur={() => validateField(roomCreateEditSchema, "room_capacity", editRoom.roomCapacity, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "room_capacity", editRoom.roomCapacity, setFormErrors)}
                />
                {/* <p className="errorText">{formErrors.room_capacity}</p> */}
                {formErrors.room_capacity && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.room_capacity}</span>
                  </div>
                )}

              </div>

              {/* Status */}
              <div>
                <label>Status </label>
                <select
                  className="nicInput"
                  value={editRoom.status}
                  onChange={(e) =>
                    setEditRoom({
                      ...editRoom,
                      status: e.target.value as "Available" | "Occupied",
                    })
                  }
                  onBlur={() => validateField(roomCreateEditSchema, "status", editRoom.status, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "status", editRoom.status, setFormErrors)}
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                </select>
                {/* <p className="errorText">{formErrors.status}</p> */}
                {formErrors.status && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.status}</span>
                  </div>
                )}

              </div>

              {/* Guest */}
              <div className="fullWidth">
                <label>Guest <span className="required">*</span></label>
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
                  onBlur={() => validateField(roomCreateEditSchema, "guest", editRoom.guest?.guestId, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "guest", editRoom.guest?.guestId, setFormErrors)}
                >
                  <option value="">— No Guest —</option>
                  {guestOptions.map((g) => (
                    <option key={g.guest_id} value={g.guest_id}>
                      {g.guest_name}
                    </option>
                  ))}
                </select>
                {/* <p className="errorText">{formErrors.guest}</p> */}
                {formErrors.guest && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.guest}</span>
                  </div>
                )}

              </div>

              {/* Room Boy */}
              <div className="fullWidth">
                <label>Room Boy </label>
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
                  onBlur={() => validateField(roomCreateEditSchema, "room_boy", editRoom.housekeeping?.hkId, setFormErrors)}
                  onKeyUp={() => validateField(roomCreateEditSchema, "room_boy", editRoom.housekeeping?.hkId, setFormErrors)}
                >
                  <option value="">— Unassigned —</option>
                  {roomBoyOptions.map((rb) => (
                    <option key={rb.id} value={rb.id}>
                      {rb.name}
                    </option>
                  ))}
                </select>
                {/* <p className="errorText">{formErrors.room_boy}</p> */}
                {formErrors.room_boy && (
                  <div className="fieldError">
                    <XCircle size={14} />
                    <span>{formErrors.room_boy}</span>
                  </div>
                )}

              </div>
            </div>

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => {setEditRoom(null);
                resetEditRoomState()}}>
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
                onClick={() => {setShowAddRoom(false); resetAddRoomState();}}
              >
                ✕
              </button>
            </div>
{Object.keys(formErrors).length > 0 && (
  <div className="alert alert-error">
    <XCircle size={18} />
    <span>Please fix the highlighted fields below.</span>
    <button onClick={() => setFormErrors({})}>
      <X size={14} />
    </button>
  </div>
)}
            {/* BODY (SCROLLABLE) */}
            <div className="nicModalBody">
              <div className="nicFormStack">

                <div>
                  <label>Room Number <span className="required">*</span></label>
                  <input
                    className="nicInput"
                    placeholder="e.g. GFD-101"
                    value={roomForm.room_no}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, room_no: e.target.value })
                    }
                    maxLength={15}
                    onKeyUp={() => validateField(roomCreateEditSchema, "room_no", roomForm.room_no, setFormErrors)}
                    onBlur={() => validateField(roomCreateEditSchema, "room_no", roomForm.room_no, setFormErrors)}
                  />
                  {/* <p className="errorText">{formErrors.room_no}</p> */}
                  {formErrors.room_no && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.room_no}</span>
                    </div>
                  )}

                </div>

                <div>
                  <label>Room Name <span className="required">*</span></label>
                  <input
                    className="nicInput"
                    placeholder="e.g. Ground Floor Double"
                    value={roomForm.room_name}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, room_name: e.target.value })
                    }
                    maxLength={50}
                    onKeyUp={() => validateField(roomCreateEditSchema, "room_name", roomForm.room_name, setFormErrors)}
                    onBlur={() => validateField(roomCreateEditSchema, "room_name", roomForm.room_name, setFormErrors)}
                  />
                  {/* <p className="errorText">{formErrors.room_name}</p> */}
                  {formErrors.room_name && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.room_name}</span>
                    </div>
                  )}

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
                    maxLength={50}
                    onBlur={() => validateField(roomCreateEditSchema, "building_name", roomForm.building_name, setFormErrors)}
                    onKeyUp={() => validateField(roomCreateEditSchema, "building_name", roomForm.building_name, setFormErrors)}
                  />
                  {/* <p className="errorText">{formErrors.building_name}</p> */}
                  {formErrors.building_name && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.building_name}</span>
                    </div>
                  )}

                </div>

                <div>
                  <label>Residence Type <span className="required">*</span></label>
                  <input
                    className="nicInput"
                    placeholder="e.g. First Floor / Penthouse"
                    value={roomForm.residence_type}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, residence_type: e.target.value })
                    }
                    maxLength={50}
                    onBlur={() => validateField(roomCreateEditSchema, "residence_type", roomForm.residence_type, setFormErrors)}
                    onKeyUp={() => validateField(roomCreateEditSchema, "residence_type", roomForm.residence_type, setFormErrors)}
                  />
                  {/* <p className="errorText">{formErrors.residence_type}</p> */}
                  {formErrors.residence_type && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.residence_type}</span>
                    </div>
                  )}

                </div>

                <div>
                  <label>Room Type<span className="required">*</span></label>
                  <input
                    className="nicInput"
                    placeholder="e.g. Single / Double / Suite"
                    value={roomForm.room_type}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, room_type: e.target.value })
                    }
                    maxLength={50}
                    onBlur={() => validateField(roomCreateEditSchema, "room_type", roomForm.room_type, setFormErrors)}
                    onKeyUp={() => validateField(roomCreateEditSchema, "room_type", roomForm.room_type, setFormErrors)}
                  />
                  {/* <p className="errorText">{formErrors.room_type}</p> */}
                  {formErrors.room_type && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.room_type}</span>
                    </div>
                  )}

                </div>

                <div>
                  <label>Room Capacity<span className="required">*</span></label>
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
                    maxLength={100}
                    onBlur={() => validateField(roomCreateEditSchema, "room_capacity", roomForm.room_capacity, setFormErrors)}
                    onKeyUp={() => validateField(roomCreateEditSchema, "room_capacity", roomForm.room_capacity, setFormErrors)}
                  />
                  {/* <p className="errorText">{formErrors.room_capacity}</p> */}
                  {formErrors.room_capacity && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.room_capacity}</span>
                    </div>
                  )}

                </div>

                <div>
                  <label>Room Category <span className="required">*</span></label>
                  <input
                    className="nicInput"
                    placeholder="e.g. Deluxe / Standard"
                    value={roomForm.room_category}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, room_category: e.target.value })
                    }
                    maxLength={50}
                    onBlur={() => validateField(roomCreateEditSchema, "room_category", roomForm.room_category, setFormErrors)}
                    onKeyUp={() => validateField(roomCreateEditSchema, "room_category", roomForm.room_category, setFormErrors)}
                  />
                  {/* <p className="errorText">{formErrors.room_category}</p> */}
                  {formErrors.room_category && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.room_category}</span>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {setShowAddRoom(false); resetAddRoomState();}}
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
          <div className="nicModal">
           
            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Assign Guest</h2>
              <button
                className="closeBtn"
                onClick={() => {setAssignGuestRoom(null);
                  resetAssignGuestState()}}
              >
                ✕
              </button>
            </div>
            {Object.keys(formErrors).length > 0 && (
  <div className="alert alert-error">
    <XCircle size={18} />
    <span>Please fix the highlighted fields below.</span>
    <button onClick={() => setFormErrors({})}>
      <X size={14} />
    </button>
  </div>
)}

            {/* BODY */}
            <div className="nicModalBody">
              <div className="nicFormStack">

                {/* Room (read-only info) */}
                <div className="text-sm text-gray-700">
                  <strong>Room:</strong> {assignGuestRoom.roomNo}
                </div>

                {/* Guest (REQUIRED) */}
                <div>
                  <label className="nicLabel">
                    Guest <span className="required">*</span>
                  </label>
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
                  {/* {formErrors.guest && (
                    <p className="errorText">{formErrors.guest}</p>
                  )} */}
                  {formErrors.guest && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.guest}</span>
                    </div>
                  )}

                </div>

                {/* Check-in Date (derived, read-only) */}
                <div>
                  <label className="nicLabel">Check-in Date</label>
                  <input
                    type="date"
                    className="nicInput"
                    value={assignCheckInDate}
                    readOnly
                  />
                </div>

                {/* Check-out Date (derived, read-only) */}
                <div>
                  <label className="nicLabel">Check-out Date</label>
                  <input
                    type="date"
                    className="nicInput"
                    value={assignCheckOutDate}
                    readOnly
                  />
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {setAssignGuestRoom(null);
                  resetAssignGuestState()}}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={submitAssignGuest}>
                Assign
              </button>
            </div>
        </div>
        </div>
      )}

      {/* ================= VIEW ROOM ================= */}
      {viewRoom && (
        <div className="modalOverlay">
          <div className="nicModal wide">

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
              <div className="detailGridHorizontal">

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
                      <p><b>Check-In:</b> {formatDate(viewRoom.guest.checkInDate) || "—"}</p>
                      <p><b>Check-Out:</b> {formatDate(viewRoom.guest.checkOutDate) || "—"}</p>
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
                      <p><b>Task Date:</b> {formatDate(viewRoom.housekeeping.taskDate)}</p>
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
          <div className="nicModal">
          
            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Add Room Boy</h2>
              <button
                className="closeBtn"
                onClick={() => {
                  setShowAddRoomBoy(false);
                  resetRoomBoyForm();
                }}
              >
                ✕
              </button>
            </div>
{Object.keys(formErrors).length > 0 && (
  <div className="alert alert-error">
    <XCircle size={18} />
    <span>Please fix the highlighted fields below.</span>
    <button onClick={() => setFormErrors({})}>
      <X size={14} />
    </button>
  </div>
)}
            {/* BODY */}
            <div className="nicModalBody">
              <div className="nicFormStack">

                {/* Name */}
                <div>
                  <label className="nicLabel">
                    Name <span className="required">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={roomBoyForm.hk_name}
                    onChange={(e) =>
                      setRoomBoyForm({ ...roomBoyForm, hk_name: e.target.value })
                    }
                    maxLength={50}
                    onBlur={() =>
                      validateField(housekeepingCreateEditSchema, "hk_name", roomBoyForm.hk_name, setFormErrors)
                    }
                  />
                  {/* <p className="errorText">{formErrors.hk_name}</p> */}
                  {formErrors.hk_name && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.hk_name}</span>
                    </div>
                  )}

                </div>

                {/* Local Name */}
                {/* <div>
                  <label className="nicLabel">Local Name</label>
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
                </div> */}

                {/* Contact */}
                <div>
                  <label className="nicLabel">
                    Contact <span className="required">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={roomBoyForm.hk_contact}
                    onChange={(e) =>
                      setRoomBoyForm({ ...roomBoyForm, hk_contact: e.target.value })
                    }
                    maxLength={10}
                    onBlur={() =>
                      validateField(housekeepingCreateEditSchema, "hk_contact", roomBoyForm.hk_contact, setFormErrors)
                    }
                  />
                  {/* <p className="errorText">{formErrors.hk_contact}</p> */}
                  {formErrors.hk_contact && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.hk_contact}</span>
                    </div>
                  )}

                </div>

                {/* Alternate Contact */}
                <div>
                  <label className="nicLabel">Alternate Contact</label>
                  <input
                    className="nicInput"
                    value={roomBoyForm.hk_alternate_contact || ""}
                    onChange={(e) =>
                      setRoomBoyForm({
                        ...roomBoyForm,
                        hk_alternate_contact: e.target.value,
                      })
                    }
                    maxLength={10}
                  />
                </div>

                {/* Shift */}
                <div>
                  <label className="nicLabel">
                    Shift <span className="required">*</span>
                  </label>
                  <select
                    className="nicInput"
                    value={roomBoyForm.shift}
                    onChange={(e) =>
                      setRoomBoyForm({
                        ...roomBoyForm,
                        shift: e.target.value as "Morning" | "Evening" | "Night" | "Full-Day",
                      })
                    }
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Full-Day">Full-Day</option>
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="nicLabel">Address<span className="required">*</span></label>
                  <textarea
                    className="nicInput"
                    rows={3}
                    value={roomBoyForm.address || ""}
                    onChange={(e) =>
                      setRoomBoyForm({ ...roomBoyForm, address: e.target.value })
                    }
                    maxLength={300}
                  />
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {
                  setShowAddRoomBoy(false);
                  resetRoomBoyForm();
                }}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={handleAddRoomBoy}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT ROOM BOY MODAL ================= */}
      {showEditRoomBoy && selectedRoomBoy && (
        <div className="modalOverlay">
          <div className="nicModal">
          
            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Edit Room Boy</h2>
              <button
                className="closeBtn"
                onClick={() => setShowEditRoomBoy(false)}
              >
                ✕
              </button>
            </div>
{Object.keys(formErrors).length > 0 && (
  <div className="alert alert-error">
    <XCircle size={18} />
    <span>Please fix the highlighted fields below.</span>
    <button onClick={() => setFormErrors({})}>
      <X size={14} />
    </button>
  </div>
)}
            {/* BODY */}
            <div className="nicModalBody">
              <div className="nicFormStack">

                {/* Name */}
                <div>
                  <label className="nicLabel">
                    Name <span className="required">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={roomBoyForm.hk_name}
                    onChange={(e) =>
                      setRoomBoyForm({ ...roomBoyForm, hk_name: e.target.value })
                    }
                    maxLength={50}
                    onBlur={() =>
                      validateField(housekeepingCreateEditSchema, "hk_name", roomBoyForm.hk_name, setFormErrors)
                    }
                  />
                  {/* <p className="errorText">{formErrors.hk_name}</p> */}
                  {formErrors.hk_name && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.hk_name}</span>
                    </div>
                  )}

                </div>

                {/* Local Name
                <div>
                  <label className="nicLabel">Local Name</label>
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
                </div> */}

                {/* Contact */}
                <div>
                  <label className="nicLabel">
                    Contact <span className="required">*</span>
                  </label>
                  <input
                    className="nicInput"
                    value={roomBoyForm.hk_contact}
                    onChange={(e) =>
                      setRoomBoyForm({ ...roomBoyForm, hk_contact: e.target.value })
                    }
                    maxLength={10}
                    onBlur={() =>
                      validateField(housekeepingCreateEditSchema, "hk_contact", roomBoyForm.hk_contact, setFormErrors)
                    }
                  />
                  {/* <p className="errorText">{formErrors.hk_contact}</p> */}
                  {formErrors.hk_contact && (
                    <div className="fieldError">
                      <XCircle size={14} />
                      <span>{formErrors.hk_contact}</span>
                    </div>
                  )}

                </div>

                {/* Alternate Contact */}
                <div>
                  <label className="nicLabel">Alternate Contact</label>
                  <input
                    className="nicInput"
                    value={roomBoyForm.hk_alternate_contact || ""}
                    onChange={(e) =>
                      setRoomBoyForm({
                        ...roomBoyForm,
                        hk_alternate_contact: e.target.value,
                      })
                    }
                    maxLength={10}
                  />
                </div>

                {/* Shift */}
                <div>
                  <label className="nicLabel">
                    Shift <span className="required">*</span>
                  </label>
                  <select
                    className="nicInput"
                    value={roomBoyForm.shift}
                    onChange={(e) =>
                      setRoomBoyForm({
                        ...roomBoyForm,
                        shift: e.target.value as "Morning" | "Evening" | "Night" | "Full-Day",
                      })
                    }
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Full-Day">Full-Day</option>
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="nicLabel">Address<span className="required">*</span></label>
                  <textarea
                    className="nicInput"
                    rows={3}
                    value={roomBoyForm.address || ""}
                    onChange={(e) =>
                      setRoomBoyForm({ ...roomBoyForm, address: e.target.value })
                    }
                    maxLength={300}
                  />
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setShowEditRoomBoy(false)}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={handleEditRoomBoy}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW ROOM BOY MODAL ================= */}
      {viewRoomBoy && (
        <div className="modalOverlay">
          <div className="nicModal wide">

            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Room Boy Details</h2>
              <button className="closeBtn" onClick={() => setViewRoomBoy(null)}>
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="nicModalBody">
              <div className="detailGridHorizontal">

                <div className="detailSection">
                  <h4>Basic Information</h4>
                  <p><b>Name:</b> {viewRoomBoy.hk_name}</p>
                  <p><b>Local Name:</b> {viewRoomBoy.hk_name_local_language || "—"}</p>
                  <p><b>Shift:</b> {viewRoomBoy.shift}</p>
                </div>

                <div className="detailSection">
                  <h4>Contact</h4>
                  <p><b>Contact:</b> {viewRoomBoy.hk_contact}</p>
                  <p><b>Alt Contact:</b> {viewRoomBoy.hk_alternate_contact || "—"}</p>
                </div>

                <div className="detailSection">
                  <h4>Address</h4>
                  <p>{viewRoomBoy.address || "—"}</p>
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setViewRoomBoy(null)}>
                Close
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
          {deleteRoomBoyError && (
            <div
              style={{
                marginBottom: "12px",
                padding: "10px 12px",
                border: "1px solid #f5c2c7",
                backgroundColor: "#f8d7da",
                color: "#842029",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              {deleteRoomBoyError}
            </div>
          )}
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <strong>{selectedRoomBoy.hk_name}</strong>?
            </p>

            <div className="modalActions">
              <button
                className="linkBtn"
                onClick={() => {setShowDeleteRoomBoyConfirm(false); setDeleteRoomBoyError(null)}}
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