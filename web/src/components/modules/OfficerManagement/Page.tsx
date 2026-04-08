'use client';
import { useEffect, useState } from "react";
import { Plus, Eye, Edit, User, XCircle, Trash2, Wifi, Users, Router, ShieldAlert, CheckCircle, Smartphone } from "lucide-react";
import { GuestTableFilters } from "@/components/guest/GuestTableFilters";
import { Button } from "@/components/ui/button";
import { ZodError } from "zod";
import "./OfficerManagement.css";
import { StatCard } from "@/components/ui/StatCard";
// Liaison
import {
  getLiasoningOfficers,
  getLiasoningOfficerById,
  createLiasoningOfficer,
  updateLiasoningOfficer,
  softDeleteLiasoningOfficer
} from "@/api/liasoning-officer.api";
// Medical
import {
  getMedicalEmergencyServices,
  createMedicalEmergencyService,
  updateMedicalEmergencyService,
  softDeleteMedicalEmergencyService
} from "@/api/medicalEmergencyService.api";
// Guest Assignment
import {
  assignLiasoningOfficer,
  removeGuestLiasoningOfficer,
  getGuestOfficerTable
} from "@/api/guestLiasoningOfficer.api";
import {
  assignMedicalContactToGuest,
  removeGuestMedicalContact
} from "@/api/guestMedicalContact.api";
import { liasoningOfficerCreateSchema, liasoningOfficerUpdateSchema } from "@/validation/liasioningOfficer.validation";
import { medicalEmergencyUpdateSchema } from "@/validation/medicalEmergencyService.validation";
import { useTableQuery } from "@/hooks/useTableQuery";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { validateSingleField as validateField } from "@/utils/validateSingleField";
import { FieldError } from "@/components/ui/FieldError";
// import { getActiveRooms } from "@/api/rooms.api";
import { useError } from "@/context/ErrorContext";

type AssignMessengerForm = {
    assigned_to: string;
    // admin_remark: string;
};

type GuestOfficerView = {
  guest_id: string;
  guest_name: string;
  guest_name_local_language: string;
  guest_mobile: string;

  room_id: string | null;
  room_no: string | null;

  liaison_name: string | null;
  liaison_status: string | null;
  liaison_mobile: string | null;

  medical_name: string | null;
  medical_status: string | null;
  medical_mobile: string | null;
  provider_name?: string;
  network_status?: string;
  messenger_status?: string;
};

export default function OfficerManagement() {

    const [activeTab, setActiveTab] = useState<"guestOfficerMng" | "liaisoningOfficer" | "medicalOfficer">("guestOfficerMng");
    const { showError } = useError();

    const [addSuccess, setAddSuccess] = useState(false);

    // Guest Network
    const guestTable = useTableQuery({
        prefix: "guest",
        sortBy: "guest_name",
        sortOrder: "asc",
    });
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [, setViewLoading] = useState(false);

    /* ================= GUEST NETWORK ================= */
    const [liaisonOfficers, setLiaisonOfficers] = useState<any[]>([]);
    const [viewLiaisoningOfficer, setViewLiaisoningOfficer] = useState<any>(null);
    const [editLiaisoningOfficer, setEditLiaisoningOfficer] = useState<any>(null);
    const [liaisoningOfficerModalOpen, setLiaisoningOfficerModalOpen] = useState(false);
    const [isAddLiaisoningOfficer, setIsAddLiaisoningOfficer] = useState(false);
    const [liaisonForm, setLiaisonForm] = useState({
    officer_name: "",
    officer_name_local_language: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    role_id: "",
    address: "",
    department: "",
    });
    const liaisonTable = useTableQuery({
        prefix: "liaison",
        sortBy: "officer_name",
        sortOrder: "asc",
        status: "all",
    });
    const [liaisonTotal, setLiaisonTotal] = useState(0);
    const [liaisonLoading, setLiaisonLoading] = useState(false);
    const [liaisonStats, setLiaisonStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    });
    // const [rooms, setRooms] = useState<any[]>([]);
    const [guestRows, setGuestRows] = useState<GuestOfficerView[]>([]);
    const [assignModal, setAssignModal] = useState(false);
    const [assignTouched, setAssignTouched] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<GuestOfficerView | null>(null);

    const [assignForm, setAssignForm] = useState<AssignMessengerForm>({
        assigned_to: "",
    });

    /* ================= VIEW MODALS ================= */
    const [viewGuestOfficer, setViewGuestOfficer] = useState<GuestOfficerView | null>(null);
    const [editGuest, setEditGuest] = useState<GuestOfficerView | null>(null);
    // const [guestForm, setGuestForm] = useState<GuestNetworkEditForm>({
    //     provider_id: "",
    //     remarks: "",
    // });
    /* ================= MESSENGERS ================= */
    const [medicalOfficers, setMedicalOfficers] = useState<any[]>([]);
    const medicalTable = useTableQuery({
        prefix: "medical",
        sortBy: "service_provider_name",
        sortOrder: "asc",
        status: "all",
    });
    const [medicalForm, setMedicalForm] = useState({
        service_provider_name: "",
        mobile: "",
        alternate_mobile: "",
        email: "",
        address_line: "",
    });
    const [editMedicalOfficer, setEditMedicalOfficer] = useState<any>(null);
    const [medicalEditForm, setMedicalEditForm] = useState<any>({});
    const [showAddMedicalOfficer, setShowAddMedicalOfficer] = useState(false);  
    const [viewMedicalOfficer, setViewMedicalOfficer] = useState<any | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [guestTotal, setGuestTotal] = useState(0);
    const [guestLoading, setGuestLoading] = useState(false);
    const [medicalTotal, setMedicalTotal] = useState(0);
    const [medicalLoading, setMedicalLoading] = useState(false);
    const [guestForm, setGuestForm] = useState<{ provider_id: string; remarks: string }>({
        provider_id: "",
        remarks: "",
    });

    /* ================= STATS STATE ================= */
    const [guestStats, setGuestStats] = useState({
        total: 0,
        requested: 0,
        connected: 0,
        disconnected: 0,
        issueReported: 0,
        resolved: 0,
        cancelled: 0,
        medicalAssigned: 0,
    });
    const [medicalStats, setMedicalStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        assigned: 0,
        unassigned: 0,
    });

    function resetLiaisonForm() {
    setLiaisonForm({
        officer_name: "",
        officer_name_local_language: "",
        mobile: "",
        alternate_mobile: "",
        email: "",
        role_id: "",
        address: "",
        department: "",
    });

    setFormErrors({});
    setEditLiaisoningOfficer(null);
    }
    /* ================= PREFILL EFFECTS ================= */
    useEffect(() => {
    if (editMedicalOfficer) {
        setMedicalEditForm({
        service_provider_name: editMedicalOfficer.service_provider_name,
        mobile: editMedicalOfficer.mobile,
        alternate_mobile: editMedicalOfficer.alternate_mobile,
        email: editMedicalOfficer.email,
        address_line: editMedicalOfficer.address_line,
        });
    }
    }, [editMedicalOfficer]);

    useEffect(() => {
    loadLiaisonOfficers();
    }, [
    liaisonTable.query.page,
    liaisonTable.query.limit,
    liaisonTable.query.search,
    liaisonTable.query.sortBy,
    liaisonTable.query.sortOrder,
    liaisonTable.query.status,
    ]);
    useEffect(() => {
    loadMedicalOfficers();
    }, [
    medicalTable.query.page,
    medicalTable.query.limit,
    medicalTable.query.search,
    medicalTable.query.sortBy,
    medicalTable.query.sortOrder,
    medicalTable.query.status,
    ]);
    async function loadGuestOfficerTable() {
    setGuestLoading(true);

    try {
        const res = await getGuestOfficerTable({
        page: guestTable.query.page,
        limit: guestTable.query.limit,
        search: guestTable.query.search,
        sortBy: guestTable.query.sortBy,
        sortOrder: guestTable.query.sortOrder,
        });

        setGuestRows(res?.data ?? []);
        setGuestTotal(res?.totalCount ?? 0);

        setGuestStats({
        total: res?.stats?.total ?? 0,
        requested: 0,
        connected: 0,
        disconnected: 0,
        issueReported: 0,
        resolved: 0,
        cancelled: 0,
        medicalAssigned: res?.stats?.medicalAssigned ?? 0,
        });

    } catch (err) {
        console.error("Failed to load guest officer table", err);
        setGuestRows([]);
        setGuestTotal(0);
    } finally {
        setGuestLoading(false);
    }
    }
    async function loadLiaisonOfficers() {
        setLiaisonLoading(true);

        try {
            const res = await getLiasoningOfficers({
            page: liaisonTable.query.page,
            limit: liaisonTable.query.limit,
            search: liaisonTable.query.search,
            sortBy: liaisonTable.query.sortBy,
            sortOrder: liaisonTable.query.sortOrder,
            isActive:
                liaisonTable.query.status === "all"
                ? undefined
                : liaisonTable.query.status === "active",
            });

            setLiaisonOfficers(res?.data ?? []);
            setLiaisonTotal(res?.totalCount ?? 0);

            // OPTIONAL stats (if backend supports)
            setLiaisonStats({
            total: res?.totalCount ?? 0,
            active: res?.data?.filter((x: any) => x.is_active)?.length ?? 0,
            inactive:
                (res?.data?.filter((x: any) => !x.is_active)?.length ?? 0),
            });
        } catch (err: any) {
        console.log("ERROR:", err); // 👈 ADD THIS

        if (err instanceof ZodError) {
            const errors: Record<string, string> = {};
            err.issues.forEach((issue) => {
            const field = issue.path[0] as string;
            errors[field] = issue.message;
            });
            setFormErrors(errors);
        } else {
            showError("Something went wrong");
        }
        } finally {
            setLiaisonLoading(false);
        }
    }
    async function loadMedicalOfficers() {
    setMedicalLoading(true);

    try {
        const res = await getMedicalEmergencyServices({
        page: medicalTable.query.page,
        limit: medicalTable.query.limit,
        search: medicalTable.query.search,
        sortBy: medicalTable.query.sortBy,
        sortOrder: medicalTable.query.sortOrder,
        isActive:
            medicalTable.query.status === "all"
            ? undefined
            : medicalTable.query.status === "active",
        });

        setMedicalOfficers(res?.data ?? []);
        setMedicalTotal(res?.totalCount ?? 0);

        setMedicalStats({
        total: res?.totalCount ?? 0,
        active: res?.data?.filter((x: any) => x.is_active)?.length ?? 0,
        inactive: res?.data?.filter((x: any) => !x.is_active)?.length ?? 0,
        assigned: 0,
        unassigned: 0,
        });

    } catch (err) {
        console.error("Failed to load medical officers", err);
        setMedicalOfficers([]);
        setMedicalTotal(0);
    } finally {
        setMedicalLoading(false);
    }
    }
    async function handleAddMedicalOfficer() {
    try {
        await createMedicalEmergencyService({
            service_id: "TEMP",
            service_type: "doctor", // or "ambulance"
            ...medicalForm,
        });

        setShowAddMedicalOfficer(false);
        setMedicalForm({
        service_provider_name: "",
        mobile: "",
        alternate_mobile: "",
        email: "",
        address_line: "",
        });

        loadMedicalOfficers();

    } catch (err: any) {
        showError(err?.response?.data?.message || "Failed to add");
    }
    }

    /* ================= ASSIGN MESSENGER HANDLER ================= */
    async function handleAssignMedical() {
    if (!selectedGuest || !assignForm.assigned_to) return;

    try {
        const isMedical = medicalOfficers.some(
        (m: any) => m.service_id === assignForm.assigned_to
        );

        if (isMedical) {
        await assignMedicalContactToGuest({
            guest_id: selectedGuest.guest_id,
            service_id: assignForm.assigned_to,
        });
        } else {
        await assignLiasoningOfficer({
            guest_id: selectedGuest.guest_id,
            officer_id: assignForm.assigned_to,
            from_date: new Date().toISOString(), // REQUIRED
        });
        }

        await loadGuestOfficerTable();
        setAssignModal(false);
        // setAssignForm({ assigned_to: "", admin_remark: "" });
        setSelectedGuest(null);

    } catch (err: any) {
        showError(err?.response?.data?.message || "Assignment failed");
    }
    }

    /* ================= LOADERS ================= */
    useEffect(() => {
        loadGuestOfficerTable();
    }, [guestTable.query]);

    useEffect(() => {
        loadLiaisonOfficers();
        loadMedicalOfficers();
    }, []);

    /* ================= COLUMN DEFINITIONS ================= */
    const guestOfficerColumns: Column<GuestOfficerView>[] = [
    {
        header: "Guest",
        accessor: "guest_name",
        sortable: true,
        sortKey: "guest_name",
    },
    {
        header: "Room",
        render: (row) => row.room_no || "—",
    },
    {
        header: "Liaison Officer",
        render: (row) => row.liaison_name || "—",
    },
    {
        header: "Medical Officer",
        render: (row) => row.medical_name || "—",
    },
    {
        header: "Status",
        render: (row) => {
        const base =
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

        if (!row.liaison_status && !row.medical_status) {
            return "—";
        }

        if (row.liaison_status) {
            return (
            <span className={`${base} bg-blue-100 text-blue-800`}>
                Liaison Assigned
            </span>
            );
        }

        if (row.medical_status) {
            return (
            <span className={`${base} bg-green-100 text-green-800`}>
                Medical Assigned
            </span>
            );
        }

        return "—";
        },
    },
    {
    header: "Actions",
    render: (row) => (
        <div className="flex gap-3">

        {/* VIEW */}
        <button
            className="icon-btn text-blue-600"
            onClick={() => setViewGuestOfficer(row)}
        >
            <Eye size={16} />
        </button>

        {/* ASSIGN */}
        <button
            className="icon-btn text-purple-600"
            onClick={() => {
            setSelectedGuest(row);
            setAssignModal(true);
            }}
        >
            <User size={16} />
        </button>

        {/* 🔥 REMOVE LIAISON */}
        {row.liaison_name && (
            <button
            className="icon-btn text-red-500"
            title="Remove Liaison"
            onClick={async () => {
                try {
                await removeGuestLiasoningOfficer(row.guest_id);
                await loadGuestOfficerTable();
                } catch (err: any) {
                showError("Failed to remove liaison");
                }
            }}
            >
            <Trash2 size={16} />
            </button>
        )}

        {/* 🔥 REMOVE MEDICAL */}
        {row.medical_name && (
            <button
            className="icon-btn text-orange-500"
            title="Remove Medical"
            onClick={async () => {
                try {
                await removeGuestMedicalContact(row.guest_id);
                await loadGuestOfficerTable();
                } catch (err: any) {
                showError("Failed to remove medical");
                }
            }}
            >
            <XCircle size={16} />
            </button>
        )}
        </div>
    ),
    }
    ];
    const liaisonColumns: Column<any>[] = [
    {
        header: "Name",
        accessor: "officer_name",
        sortable: true,
        sortKey: "officer_name",
      render: (g) => (
        <>
          <p className="font-medium">{g.officer_name}</p>
          <p className="text-xs text-gray-500">
            {g.officer_name_local_language}
          </p>
        </>
      ),
    },
    {
        header: "Mobile",
        accessor: "mobile",
      render: (g) => (
        <>
          <p>{g.mobile}</p>
          <p className="text-xs text-gray-500">
            {g.alternate_mobile}
          </p>
        </>
      ),
    },
    {
        header: "Email",
        render: (row) => row.email || "—",
    },
    {
        header: "Status",
        render: (row) => {
        const base =
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

        return row.is_active ? (
            <span className={`${base} bg-green-100 text-green-800`}>
            Active
            </span>
        ) : (
            <span className={`${base} bg-red-100 text-red-800`}>
            Inactive
            </span>
        );
        },
    },
    {
        header: "Actions",
        render: (row) => (
        <div className="flex items-center gap-3">

            {/* VIEW */}
            <button
            className="icon-btn text-blue-600"
            title="View Officer"
            onClick={async () => {
                try {
                    setViewLoading(true);
                    const data = await getLiasoningOfficerById(row.officer_id);
                    setViewLiaisoningOfficer(data);
                } catch (err: any) {
                    showError("Failed to load officer details");
                } finally {
                    setViewLoading(false);
                }
            }}
            >
            <Eye size={16} />
            </button>

            {/* EDIT */}
            <button
            className="icon-btn text-green-600"
            title="Edit"
            onClick={() => {
                setEditLiaisoningOfficer(row);
                setIsAddLiaisoningOfficer(false);
                setLiaisoningOfficerModalOpen(true);

                setLiaisonForm({
                officer_name: row.officer_name || "",
                officer_name_local_language: row.full_name_local_language || "",
                mobile: row.mobile || "",
                alternate_mobile: row.alternate_mobile || "",
                email: row.email || "",
                role_id: row.role_id || "",
                department: "",
                address: "",
                });
            }}
            >
            <Edit size={16} />
            </button>

            {/* DELETE */}
            <button
            className="icon-btn text-red-600"
            title="Delete"
            onClick={async () => {
                try {
                    await softDeleteLiasoningOfficer(row.officer_id);
                    await loadLiaisonOfficers();
                } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    "Unable to delete officer";
                showError(message);
                }
            }}
            >
            <Trash2 size={16} />
            </button>

        </div>
        ),
    },
    ];
    const medicalColumns: Column<any>[] = [
    {
        header: "Name",
        accessor: "service_provider_name",
        sortable: true,
        sortKey: "service_provider_name",
    },
    {
        header: "Mobile",
        accessor: "mobile",
    },
    {
        header: "Email",
        render: (row) => row.email || "—",
    },
    {
        header: "Status",
        render: (row) => {
        const base =
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

        return row.is_active ? (
            <span className={`${base} bg-green-100 text-green-800`}>
            Active
            </span>
        ) : (
            <span className={`${base} bg-red-100 text-red-800`}>
            Inactive
            </span>
        );
        },
    },
    {
        header: "Actions",
        render: (row) => (
        <div className="flex gap-3">
            <button
            className="icon-btn text-blue-600"
            onClick={() => setViewMedicalOfficer(row)}
            >
            <Eye size={16} />
            </button>

            <button
            className="icon-btn text-green-600"
            onClick={() => setEditMedicalOfficer(row)}
            >
            <Edit size={16} />
            </button>

            <button
            className="icon-btn text-red-600"
            onClick={async () => {
                try {
                    await softDeleteMedicalEmergencyService(row.service_id);
                    loadMedicalOfficers();
                } catch (err: any) {
                    showError(err?.response?.data?.message || "Delete failed");
                }
            }}
            >
            <Trash2 size={16} />
            </button>
        </div>
        ),
    },
    ];
    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <h2 className="text-[#00247D] text-xl font-semibold">
                    Network Management
                </h2>
                <p className="text-sm text-gray-600">
                    Wi-Fi access & stationery handling
                </p>
            </div>

            {/* ================= TABS ================= */}
            <div className="nicTabs">
                <button
                    className={`nicTab ${activeTab === "guestOfficerMng" ? "active" : ""}`}
                    onClick={() => { setActiveTab("guestOfficerMng"); }}
                >
                    Guest Assignment
                </button>

                <button
                    className={`nicTab ${activeTab === "liaisoningOfficer" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("liaisoningOfficer");
                        setDeleteError(null);
                    }}
                >
                    Liaisoning Officer
                </button>

                <button
                    className={`nicTab ${activeTab === "medicalOfficer" ? "active" : ""}`}
                    onClick={() => { setActiveTab("medicalOfficer"); setDeleteError(null); }}
                >
                    Medical Officer
                </button>
            </div>


            {/* ================= TAB 1: GUEST NETWORK ================= */}
            {activeTab === "guestOfficerMng" && (
                <PageLayout
                    title=""
                    subtitle=""
                    toolbar={
                        <PageToolbar
                            left={
                                <div className="flex-1 w-full min-w-[200px]">
                                    <GuestTableFilters
                                        searchInput={guestTable.searchInput}
                                        setSearchInput={guestTable.setSearchInput}
                                        query={guestTable.query}
                                        batchUpdate={guestTable.batchUpdate}
                                        defaultSortBy="guest_name"
                                        variant="toolbar"
                                    />
                                </div>
                            }
                        />
                    }
                    stats={
                        <>
                            <StatCard
                                title="Total Allocated"
                                value={guestStats.total}
                                icon={Smartphone}
                                variant="blue"
                            />
                            <StatCard
                                title="Requested"
                                value={guestStats.requested}
                                icon={Wifi}
                                variant="orange"
                            />
                            <StatCard
                                title="Connected"
                                value={guestStats.connected}
                                icon={CheckCircle}
                                variant="green"
                            />
                            <StatCard
                                title="Issue Reported"
                                value={guestStats.issueReported}
                                icon={ShieldAlert}
                                variant="red"
                            />
                        </>
                    }
                >
                    <div className="bg-white border rounded-sm overflow-hidden">
                        <DataTable
                            data={guestRows}
                            columns={guestOfficerColumns}
                            keyField="guest_id"
                            page={guestTable.query.page}
                            limit={guestTable.query.limit}
                            totalCount={guestTotal}
                            sortBy={guestTable.query.sortBy}
                            sortOrder={guestTable.query.sortOrder}
                            loading={guestLoading}
                            onPageChange={guestTable.setPage}
                            onLimitChange={guestTable.setLimit}
                            onSortChange={guestTable.setSort}
                        />
                    </div>
                </PageLayout>
            )}

            {/* ================= TAB 2: Liasioning Officer ================= */}
            {activeTab === "liaisoningOfficer" && (
                <PageLayout
                    title=""
                    subtitle=""
                    toolbar={
                        <PageToolbar
                            left={
                                <div className="flex-1 min-w-[250px] max-w-md">
                                    <input
                                        className="px-3 py-2 w-full border rounded-sm nicInput"
                                        placeholder="Search provider, type, bandwidth..."
                                        value={liaisonTable.query.search ?? ""}
                                        onChange={(e) => liaisonTable.setSearchInput(e.target.value)}
                                        maxLength={300}
                                    />
                                </div>
                            }
                            right={
                                <Button
                                    onClick={() => {
                                    setIsAddLiaisoningOfficer(true);
                                    setLiaisoningOfficerModalOpen(true);

                                    setLiaisonForm({
                                        officer_name: "",
                                        officer_name_local_language: "",
                                        mobile: "",
                                        alternate_mobile: "",
                                        email: "",
                                        role_id: "",
                                        address: "",
                                        department: "",
                                    });
                                    }}
                                    className="bg-[#00247D] hover:bg-[#003399] text-white btn-icon-text h-10 px-4"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Liaisoning Officer
                                </Button>
                            }
                        />
                    }
                    stats={
                        <>
                            <StatCard
                            title="Total Officers"
                            value={liaisonStats.total}
                            icon={Router}
                            variant="blue"
                            active={true}
                            onClick={() => liaisonTable.setStatus("all")}
                            />

                            <StatCard
                            title="Active"
                            value={liaisonStats.active}
                            icon={CheckCircle}
                            variant="green"
                            active={liaisonTable.query.status === "active"}
                            onClick={() => liaisonTable.setStatus("active")}
                            />

                            <StatCard
                            title="Inactive"
                            value={liaisonStats.inactive}
                            icon={XCircle}
                            variant="red"
                            active={liaisonTable.query.status === "inactive"}
                            onClick={() => liaisonTable.setStatus("inactive")}
                            />
                        </>
                    }
                >
                    {deleteError && (
                        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {deleteError}
                        </div>
                    )}
                    <div className="bg-white border rounded-sm overflow-hidden">
                    <DataTable
                        data={liaisonOfficers}
                        columns={liaisonColumns}
                        keyField="officer_id"
                        page={liaisonTable.query.page}
                        limit={liaisonTable.query.limit}
                        totalCount={liaisonTotal}
                        sortBy={liaisonTable.query.sortBy}
                        sortOrder={liaisonTable.query.sortOrder}
                        loading={liaisonLoading}
                        onPageChange={liaisonTable.setPage}
                        onLimitChange={liaisonTable.setLimit}
                        onSortChange={liaisonTable.setSort}
                    />
                    </div>
                </PageLayout>
            )}

            {/* ================= TAB 3: MEDICAL OFFICER ================= */}
            {activeTab === "medicalOfficer" && (
                <PageLayout
                    title=""
                    subtitle=""
                    toolbar={
                        <PageToolbar
                            left={
                                <div className="flex-1 min-w-[250px] max-w-md">
                                    <input
                                        className="px-3 py-2 w-full border rounded-sm nicInput"
                                        placeholder="Search medical..."
                                        value={medicalTable.query.search ?? ""}
                                        onChange={(e) => medicalTable.setSearchInput(e.target.value)}
                                        maxLength={300}
                                    />
                                </div>
                            }
                            right={
                                <Button
                                    onClick={() => setShowAddMedicalOfficer(true)}
                                    className="bg-[#00247D] hover:bg-[#003399] text-white btn-icon-text h-10 px-4"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Medical Officer
                                </Button>
                            }
                        />
                    }
                    stats={
                        <>
                            <StatCard
                                title="Total Medical Officers"
                                value={medicalStats.total}
                                icon={Users}
                                variant="blue"
                                active={true}
                                onClick={() => medicalTable.setStatus("all")}
                            />

                            <StatCard
                                title="Active"
                                value={medicalStats.active}
                                icon={CheckCircle}
                                variant="green"
                                active={medicalTable.query.status === "active"}
                                onClick={() => medicalTable.setStatus("active")}
                            />

                            <StatCard
                                title="Inactive"
                                value={medicalStats.inactive}
                                icon={XCircle}
                                variant="red"
                                active={medicalTable.query.status === "inactive"}
                                onClick={() => medicalTable.setStatus("inactive")}
                            />
                        </>
                    }
                >
                    {deleteError && (
                        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {deleteError}
                        </div>
                    )}
                    <div className="bg-white border rounded-sm overflow-hidden">
                        <DataTable
                            data={medicalOfficers}
                            columns={medicalColumns}
                            keyField="service_id"
                            page={medicalTable.query.page}
                            limit={medicalTable.query.limit}
                            totalCount={medicalTotal}
                            sortBy={medicalTable.query.sortBy}
                            sortOrder={medicalTable.query.sortOrder}
                            loading={medicalLoading}
                            onPageChange={medicalTable.setPage}
                            onLimitChange={medicalTable.setLimit}
                            onSortChange={medicalTable.setSort}
                        />
                    </div>
                </PageLayout>
            )}

            {/* ================= VIEW GUEST LIASIONING OFFICER MODAL ================= */}
            {viewGuestOfficer && (
                <div className="modalOverlay">
                    <div className="nicModal wide">

                        <div className="nicModalHeader">
                            <h2>Guest Officer Details</h2>
                            <button
                                className="closeBtn"
                                onClick={() => setViewGuestOfficer(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="nicModalBody">
                            <div className="detailGridHorizontal">

                                <div className="detailSection">
                                    <h4>Guest</h4>
                                    <p><b>Name:</b> {viewGuestOfficer.guest_name}</p>
                                    <p><b>Room:</b> {viewGuestOfficer.room_id || "—"}</p>
                                </div>

                                <div className="detailSection">
                                    <h4>Liaisoning Officer</h4>
                                    <p><b>Provider:</b> {viewGuestOfficer.provider_name || "—"}</p>
                                    <p><b>Status:</b> {viewGuestOfficer.network_status || "—"}</p>
                                </div>

                                <div className="detailSection">
                                    <h4>Medical Officer</h4>
                                    <p><b>Status:</b> {viewGuestOfficer.messenger_status || "—"}</p>
                                </div>

                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => setViewGuestOfficer(null)}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ================= VIEW LIASIONING OFFICER MODAL ================= */}
            {viewLiaisoningOfficer && (
            <div className="modalOverlay">
                <div className="nicModal wide">

                <div className="nicModalHeader">
                    <h2>Liaisoning Officer Details</h2>
                    <button
                    className="closeBtn"
                    onClick={() => setViewLiaisoningOfficer(null)}
                    >
                    ✕
                    </button>
                </div>

                <div className="nicModalBody">
                    <div className="detailGridHorizontal">

                    <div className="detailSection">
                        <h4>Basic Info</h4>
                            <p><b>Name:</b> {viewLiaisoningOfficer.officer_name}</p>
                            <p><b>Local Language Name:</b> {viewLiaisoningOfficer.officer_name_local_language || "—"}</p>
                            <p><b>Email:</b> {viewLiaisoningOfficer.email || "—"}</p>
                    </div>

                    <div className="detailSection">
                        <h4>Additional Info</h4>
                            <p><b>Mobile:</b> {viewLiaisoningOfficer.mobile || "—"}</p>
                            <p><b>Alternate Mobile:</b> {viewLiaisoningOfficer.alternate_mobile || "—"}</p>
                            <p><b>Address:</b> {viewLiaisoningOfficer.address || "—"}</p>
                            <p><b>Department:</b> {viewLiaisoningOfficer.department || "—"}</p>
                    </div>

                    <div className="detailSection">
                        <h4>Status</h4>
                        <p>
                        <b>Status:</b>{" "}
                        {viewLiaisoningOfficer.is_active ? "Active" : "Inactive"}
                        </p>
                    </div>

                    </div>
                </div>

                <div className="nicModalActions">
                    <button
                    className="cancelBtn"
                    onClick={() => setViewLiaisoningOfficer(null)}
                    >
                    Close
                    </button>
                </div>

                </div>
            </div>
            )}

            {/* ================= VIEW MEDICAL OFFICER MODAL ================= */}
            {viewMedicalOfficer && (
                <div className="modalOverlay">
                    <div className="nicModal wide">

                        <div className="nicModalHeader">
                            <h2>Medical Officer Details</h2>
                            <button
                                className="closeBtn"
                                onClick={() => setViewMedicalOfficer(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="nicModalBody">
                            <div className="detailGridHorizontal">

                                <div className="detailSection">
                                    <h4>Basic Info</h4>
                                    <p><b>Name:</b> {viewMedicalOfficer.service_provider_name}</p>
                                    <p><b>Mobile:</b> {viewMedicalOfficer.mobile}</p>
                                    <p><b>Email:</b> {viewMedicalOfficer.email || "—"}</p>
                                </div>

                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => setViewMedicalOfficer(null)}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ================= ASSIGN MEDICAL OFFICER MODAL ================= */}
            {assignModal && selectedGuest && (
                <div className="modalOverlay">
                    <div className="nicModal">
                        <div className="nicModalHeader">
                            <h2>Assign Medical Officer</h2>
                            <button
                                className="closeBtn"
                                onClick={() => {
                                    setAssignModal(false);
                                    setAssignTouched(false);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="nicModalBody">
                            <div className="nicFormStack">
                                <div>
                                    <label className="nicLabel">
                                        Medical Officer <span className="nicRequired">*</span>
                                    </label>
                                    <select
                                        className="nicInput"
                                        value={assignForm.assigned_to}
                                        onChange={(e) =>
                                            setAssignForm({ ...assignForm, assigned_to: e.target.value })
                                        }
                                    >
                                    <option value="">Select Medical Officer</option>
                                    {medicalOfficers?.map((m) => (
                                    <option key={m.service_id} value={m.service_id}>
                                        {m.service_provider_name} (Medical)
                                    </option>
                                    ))}

                                    {liaisonOfficers?.map((l) => (
                                    <option key={l.officer_id} value={l.officer_id}>
                                        {l.officer_name} (Liaison)
                                    </option>
                                    ))}
                                    </select>
                                    {assignTouched && !assignForm.assigned_to && (
                                        <FieldError message={assignTouched && !assignForm.assigned_to ? "Messenger is required" : ""} />
                                    )}
                                </div>

                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => {
                                    setAssignModal(false);
                                    setAssignTouched(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="saveBtn"
                                onClick={() => {
                                    setAssignTouched(true);
                                    handleAssignMedical();
                                }}
                                disabled={!assignForm.assigned_to}
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= ADD MEDICAL OFFICER MODAL ================= */}
            {showAddMedicalOfficer && (
                    <div className="modalOverlay">
                        <div className="nicModal">

                            <div className="nicModalHeader">
                                <h2>Add Medical Officer</h2>
                                <button
                                    className="closeBtn"
                                    onClick={() => {
                                        setShowAddMedicalOfficer(false);
                                        setFormErrors({});
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="nicModalBody">
                                <div className="nicFormStack">

                                    <div>
                                        <label className="nicLabel">
                                            Name <span className="nicRequired">*</span>
                                        </label>
                                        <input
                                            className="nicInput"
                                            value={medicalForm.service_provider_name}
                                            onChange={(e) =>
                                                setMedicalForm({
                                                    ...medicalForm,
                                                    service_provider_name: e.target.value,
                                                })
                                            }
                                            maxLength={50}
                                        />
                                        {formErrors.service_provider_name && (
                                            <FieldError message={formErrors.service_provider_name} />
                                        )}
                                    </div>

                                    <div>
                                        <label className="nicLabel">
                                            Mobile <span className="nicRequired">*</span>
                                        </label>
                                        <input
                                            className="nicInput"
                                            maxLength={10}
                                            value={medicalForm.mobile}
                                            onChange={(e) =>
                                                setMedicalForm({
                                                    ...medicalForm,
                                                    mobile: e.target.value.replace(/\D/g, ""),
                                                })
                                            }
                                        />
                                        {formErrors.mobile && (
                                            <FieldError message={formErrors.mobile} />
                                        )}
                                    </div>

                                    <div>
                                        <label className="nicLabel">Email</label>
                                        <input
                                            className="nicInput"
                                            value={medicalForm.email}
                                            onChange={(e) =>
                                                setMedicalForm({
                                                    ...medicalForm,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                        {formErrors.email && (
                                            <FieldError message={formErrors.email} />
                                        )}
                                    </div>

                                    {/* <div>
                                        <label className="nicLabel">Secondary Mobile</label>
                                        <input
                                            className="nicInput"
                                            value={messengerForm.secondary_mobile}
                                            maxLength={10}
                                            onChange={(e) =>
                                                setMessengerForm({
                                                    ...messengerForm,
                                                    secondary_mobile: e.target.value.replace(/\D/g, ""),
                                                })
                                            }
                                        />
                                    </div> */}

                                    {/* <div>
                                        <label className="nicLabel">Designation</label>
                                        <input
                                            className="nicInput"
                                            value={messengerForm.designation}
                                            maxLength={50}
                                            onChange={(e) =>
                                                setMessengerForm({
                                                    ...messengerForm,
                                                    designation: e.target.value,
                                                })
                                            }
                                        />
                                    </div> */}

                                </div>
                            </div>

                            <div className="nicModalActions">
                                <button
                                    className="cancelBtn"
                                    onClick={() => {
                                        setShowAddMedicalOfficer(false);
                                        setFormErrors({});
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="saveBtn"
                                    onClick={handleAddMedicalOfficer}
                                >
                                    Save
                                </button>
                            </div>

                        </div>
                    </div>
            )}

            {liaisoningOfficerModalOpen && (
                    <div className="modalOverlay">
                        <div className="nicModal wide">

                            <div className="nicModalHeader">
                                <h2>
                                    {isAddLiaisoningOfficer ? "Add Liaisoning Officer" : "Edit Liaisoning Officer"}
                                </h2>
                                <button onClick={() => setLiaisoningOfficerModalOpen(false)}>✕</button>
                            </div>
                            <div className="nicModalBody">

                                <div className="nicFormStack">

                                    <div>
                                        <label className="nicLabel">
                                            Officer Name <span className="required">*</span>
                                        </label>
                                        <input
                                        className="nicInput"
                                        value={liaisonForm.officer_name}
                                        maxLength={100}
                                        onChange={(e) =>
                                            setLiaisonForm({ ...liaisonForm, officer_name: e.target.value })
                                        }
                                        onBlur={() =>
                                            validateField(
                                            liasoningOfficerCreateSchema,
                                            "officer_name",
                                            liaisonForm.officer_name,
                                            setFormErrors
                                            )
                                        }
                                        />
                                        <FieldError message={formErrors.officer_name} />
                                    </div>

                                    <div>
                                        <label className="nicLabel">Officer Mobile</label>
                                        <input
                                        className="nicInput"
                                        value={liaisonForm.mobile}
                                        maxLength={10}
                                        onChange={(e) =>
                                            setLiaisonForm({
                                            ...liaisonForm,
                                            mobile: e.target.value.replace(/\D/g, ""),
                                            })
                                        }
                                        onBlur={() =>
                                            validateField(
                                            liasoningOfficerCreateSchema,
                                            "mobile",
                                            liaisonForm.mobile,
                                            setFormErrors
                                            )
                                        }
                                        />
                                        <FieldError message={formErrors.mobile} />
                                    </div>
                                    <div>
                                        <label className="nicLabel">Officer Alternate Mobile</label>
                                        <input
                                        className="nicInput"
                                        value={liaisonForm.alternate_mobile}
                                        maxLength={10 | 0}
                                        onChange={(e) =>
                                            setLiaisonForm({
                                            ...liaisonForm,
                                            alternate_mobile: e.target.value.replace(/\D/g, ""),
                                            })
                                        }
                                        onBlur={() =>
                                            validateField(
                                            liasoningOfficerCreateSchema,
                                            "alternate_mobile",
                                            liaisonForm.alternate_mobile,
                                            setFormErrors
                                            )
                                        }
                                        />
                                        <FieldError message={formErrors.alternate_mobile} />
                                    </div>
                                    <div>
                                        <label className="nicLabel">Email</label>
                                        <input
                                        type="email"
                                        className="nicInput"
                                        maxLength={40}
                                        value={liaisonForm.email}
                                        onChange={(e) =>
                                            setLiaisonForm({ ...liaisonForm, email: e.target.value })
                                        }
                                        onBlur={() =>
                                            validateField(
                                            liasoningOfficerCreateSchema,
                                            "email",
                                            liaisonForm.email,
                                            setFormErrors
                                            )
                                        }
                                        />
                                        <FieldError message={formErrors.email} />
                                    </div>
                                    <div>
                                        <label className="nicLabel">Address</label>
                                        <input
                                        type="text"
                                        className="nicInput"
                                        maxLength={300}
                                        value={liaisonForm.address}
                                        onChange={(e) =>
                                            setLiaisonForm({ ...liaisonForm, address: e.target.value })
                                        }
                                        // onBlur={() =>
                                        //     validateField(
                                        //     liasoningOfficerCreateSchema,
                                        //     "address",
                                        //     liaisonForm.address,
                                        //     setFormErrors
                                        //     )
                                        // }
                                        />
                                        <FieldError message={formErrors.address} />
                                    </div>
                                    <div>
                                    <label className="nicLabel">
                                        Role ID <span className="required">*</span>
                                    </label>
                                    <input
                                        className="nicInput"
                                        value={liaisonForm.role_id}
                                        onChange={(e) =>
                                        setLiaisonForm({ ...liaisonForm, role_id: e.target.value })
                                        }
                                    />
                                    <FieldError message={formErrors.role_id} />
                                    </div>
                                </div>
                            </div>

                            <div className="nicModalActions">
                                <button
                                    className="cancelBtn"
                                    onClick={() => {
                                        setLiaisoningOfficerModalOpen(false);
                                        resetLiaisonForm();
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="saveBtn"
                                    onClick={async () => {
                                    setFormErrors({});

                                    try {
                                        const schema = isAddLiaisoningOfficer
                                        ? liasoningOfficerCreateSchema
                                        : liasoningOfficerUpdateSchema;

                                        const parsed = schema.parse(liaisonForm);

                                        if (isAddLiaisoningOfficer) {
                                        await createLiasoningOfficer(parsed as {
                                            officer_name: string;
                                            officer_name_local_language?: string;
                                            mobile: string;
                                            alternate_mobile?: string;
                                            email?: string;
                                            role_id: string;
                                            department?: string;
                                            is_active?: boolean;
                                        });
                                        setAddSuccess(true);
                                        } else {
                                        const { officer_id, ...updatePayload } = parsed;
                                        await updateLiasoningOfficer(
                                            editLiaisoningOfficer.officer_id,
                                            updatePayload as Partial<{
                                                officer_name: string;
                                                officer_name_local_language: string;
                                                mobile: string;
                                                alternate_mobile: string;
                                                email: string;
                                                role_id: string;
                                                department: string;
                                                designation: string;
                                                is_active: boolean;
                                            }>
                                        );
                                        setAddSuccess(false);
                                        }

                                        resetLiaisonForm();
                                        setLiaisoningOfficerModalOpen(false);

                                        await loadLiaisonOfficers();

                                    } catch (err: any) {
                                        console.log("ADD ERROR:", err); // 🔥 MUST ADD

                                        if (err instanceof ZodError) {
                                            const errors: Record<string, string> = {};
                                            err.issues.forEach((issue) => {
                                            const field = issue.path[0] as string;
                                            errors[field] = issue.message;
                                            });
                                            setFormErrors(errors);
                                        } else {
                                            showError(err?.response?.data?.message || "Failed to add officer");
                                        }
                                        }
                                    }}
                                >
                                    {addSuccess ? "Added ✓" : "Add New"}
                                </button>
                            </div>

                        </div>
                    </div>
            )}

            {/* ================= FIX 5: EDIT MEDICAL OFFICER MODAL ================= */}
            {editMedicalOfficer && (
                    <div className="modalOverlay">
                        <div className="nicModal">

                            <div className="nicModalHeader">
                                <h2>Edit Medical Officer</h2>
                                <button onClick={() => setEditMedicalOfficer(null)}>✕</button>
                            </div>

                            <div className="nicFormStack">
                                <div>
                                    <label className="nicLabel">
                                        Name <span className="required">*</span>
                                    </label>
                                    <input
                                        className="nicInput"
                                        value={medicalEditForm.service_provider_name}
                                        onChange={(e) =>
                                            setMedicalEditForm({
                                                ...medicalEditForm,
                                                service_provider_name: e.target.value,
                                            })
                                        }
                                        onBlur={() => validateField(medicalEmergencyUpdateSchema, "service_provider_name", medicalEditForm.service_provider_name, setFormErrors)}
                                    />
                                    <FieldError message={formErrors.service_provider_name} />
                                </div>

                                <div>
                                    <label className="nicLabel">
                                        Mobile <span className="required">*</span>
                                    </label>
                                    <input
                                        className="nicInput"
                                        value={medicalEditForm.mobile}
                                        onChange={(e) =>
                                            setMedicalEditForm({
                                                ...medicalEditForm,
                                                mobile: e.target.value,
                                            })
                                        }
                                        onBlur={() => validateField(medicalEmergencyUpdateSchema, "mobile", medicalEditForm.mobile, setFormErrors)}
                                    />
                                    <FieldError message={formErrors.mobile} />
                                </div>

                                <div>
                                    <label className="nicLabel">Email <span className="required">*</span></label>
                                    <input
                                        className="nicInput"
                                        value={medicalEditForm.email}
                                        onChange={(e) =>
                                            setMedicalEditForm({
                                                ...medicalEditForm,
                                                email: e.target.value,
                                            })
                                        }
                                        onBlur={() => validateField(medicalEmergencyUpdateSchema, "email", medicalEditForm.email, setFormErrors)}
                                    />
                                    <FieldError message={formErrors.email} />
                                </div>

                                <div>
                                    <label className="nicLabel">Secondary Mobile</label>
                                    <input
                                        className="nicInput"
                                        value={medicalEditForm.alternate_mobile}
                                        maxLength={10}
                                        onChange={(e) =>
                                            setMedicalEditForm({
                                                ...medicalEditForm,
                                                alternate_mobile: e.target.value.replace(/\D/g, ""),
                                            })
                                        }
                                        onBlur={() => validateField(medicalEmergencyUpdateSchema, "alternate_mobile", medicalEditForm.alternate_mobile, setFormErrors)}
                                    />
                                    <FieldError message={formErrors.alternate_mobile} />
                                </div>

                            </div>

                            <div className="nicModalActions">
                                <button className="cancelBtn" onClick={() => setEditMedicalOfficer(null)}>
                                    Cancel
                                </button>
                                <button
                                    className="saveBtn"
                                    onClick={async () => {
                                        await updateMedicalEmergencyService(
                                            editMedicalOfficer.service_id,
                                            medicalEditForm
                                        );
                                        setEditMedicalOfficer(null);
                                        // loadMedicalEmergencyServices();
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
            )}
            {/* ================= EDIT GUEST OFFICER MODAL ================= */}
            {
                editGuest && (
                    <div className="modalOverlay">
                        <div className="nicModal">
                            <div className="nicModalHeader">
                                <h2>Assign Liaisoning Officer</h2>
                                <button onClick={() => setEditGuest(null)}>✕</button>
                            </div>
                            <div className="nicFormStack">
                                <div>
                                    <div>
                                        <label>Guest ID</label>
                                        <input value={editGuest.guest_id} disabled />
                                    </div>
                                    <label className="nicLabel">Guest Name</label>
                                    <input
                                        className="nicInput"
                                        value={editGuest.guest_name}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="nicLabel">Room</label>
                                    <input
                                        className="nicInput"
                                        value={editGuest.room_no ?? ""}
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="nicLabel">Room</label>
                                    <input
                                        className="nicInput"
                                        value={editGuest?.room_no || "—"}
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="nicLabel">Liasoning Officer *</label>
                                    <select
                                        className="nicInput"
                                        value={guestForm.provider_id}
                                        onChange={(e) =>
                                            setGuestForm({ ...guestForm, provider_id: e.target.value })
                                        }
                                    >
                                        <option value="">Select Liasoning Officer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="nicLabel">Remarks</label>
                                    <textarea
                                        className="nicInput"
                                        rows={3}
                                        value={guestForm.remarks}
                                        onChange={(e) =>
                                            setGuestForm({ ...guestForm, remarks: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="nicModalActions">
                                <button className="cancelBtn" onClick={() => setEditGuest(null)}>Cancel</button>
                                <button
                                    className="saveBtn"
                                    disabled={!guestForm.provider_id}
                                    onClick={async () => {
                                        if (!guestForm.provider_id) {
                                            showError('Please select username');
                                            return;
                                        }

                                        try {
                                            setEditGuest(null);

                                        } catch (err: any) {
                                            const message =
                                                err?.response?.data?.message ||
                                                "Unable to assign network";
                                            showError(message);
                                        }
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
