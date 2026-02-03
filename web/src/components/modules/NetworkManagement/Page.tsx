'use client';
import { useEffect, useState } from "react";
import { Plus, Eye, Edit, User, XCircle, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZodError } from "zod";
import "./NetworkManagement.css";
import { getNetworkTable, softDeleteNetwork, updateNetwork, createNetwork } from "@/api/network.api";
import { getMessengerTable, softDeleteMessenger, createMessenger, updateMessenger } from "@/api/messenger.api";
import { getGuestNetworkTable, updateGuestNetwork, createGuestNetwork } from "@/api/guestNetwork.api";
import { unassignGuestMessenger, createGuestMessenger } from "@/api/guestMessenger.api";
import { NetworkProvider } from "@/types/network";
import { Messenger } from "@/types/messenger";
import { GuestNetwork } from "@/types/guestNetwork";
import { useTableQuery } from "@/hooks/useTableQuery";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { messengerCreateSchema } from "@/validation/messenger.validation";
import { validateSingleField as validateField } from "@/utils/validateSingleField";
// import { getActiveRooms } from "@/api/rooms.api";

type AssignMessengerForm = {
    assigned_to: string;
    admin_remark: string;
};

type GuestNetworkView = {
    guest_id: string;
    guest_name: string;

    room_id: string | null;
    room_no: string | null;

    guest_network_id: string | null;
    provider_name: string | null;
    network_status: string | null;

    guest_messenger_id: string | null;
    messenger_status: string | null;
};

type MessengerFormState = {
    messenger_name: string;
    primary_mobile: string;
    email: string;
};


export default function NetworkManagement() {

    const [activeTab, setActiveTab] =
        useState<"guestMng" | "networks" | "messengers">("guestMng");

    // Guest Network
    const guestTable = useTableQuery({
        sortBy: "guest_name",
        sortOrder: "asc",
    });

    // Networks
    const networkTable = useTableQuery({
        sortBy: "provider_name",
        sortOrder: "asc",
    });

    // Messengers
    const messengerTable = useTableQuery({
        sortBy: "messenger_name",
        sortOrder: "asc",
    });
    const [deleteError, setDeleteError] = useState<string | null>(null);

    /* ================= GUEST NETWORK ================= */
    const [networks, setNetworks] = useState<NetworkProvider[]>([]);
    // const [rooms, setRooms] = useState<any[]>([]);
    const [guestRows, setGuestRows] = useState<GuestNetworkView[]>([]);
    const [assignModal, setAssignModal] = useState(false);
    const [selectedGuest, setSelectedGuest] =
        useState<GuestNetworkView | null>(null);

    const [assignForm, setAssignForm] = useState<AssignMessengerForm>({
        assigned_to: "",
        admin_remark: "",
    });

    /* ================= VIEW MODALS ================= */
    const [viewGuestNetwork, setViewGuestNetwork] =
        useState<GuestNetworkView | null>(null);
    const [viewNetwork, setViewNetwork] = useState<NetworkProvider | null>(null);
    const [viewMessenger, setViewMessenger] = useState<Messenger | null>(null);

    /* ================= EDIT STATES ================= */
    /* ================= EDIT STATES ================= */
    const [networkModalOpen, setNetworkModalOpen] = useState(false);
    const [isAddNetwork, setIsAddNetwork] = useState(false);
    const [editNetwork, setEditNetwork] = useState<NetworkProvider | null>(null);
    const [editMessenger, setEditMessenger] = useState<Messenger | null>(null);

    const [networkForm, setNetworkForm] = useState({
        provider_name: "",
        provider_name_local_language: "",
        network_type: "WiFi" as "WiFi" | "Broadband" | "Hotspot" | "Leased-Line",
        bandwidth_mbps: "",
        username: "",
        password: "",
        static_ip: "",
        address: "",
    });

    const [messengerEditForm, setMessengerEditForm] = useState({
        messenger_name: "",
        primary_mobile: "",
        email: "",
    });

    const [editGuest, setEditGuest] = useState<GuestNetworkView | null>(null);
    const [guestForm, setGuestForm] = useState<{
        guest_name: string;
        network_status: GuestNetwork['network_status'] | "";
    }>({
        guest_name: "",
        network_status: "",
    });

    /* ================= MESSENGERS ================= */
    const [messengers, setMessengers] = useState<Messenger[]>([]);
    const [showAddMessenger, setShowAddMessenger] = useState(false);
    const [messengerForm, setMessengerForm] = useState<MessengerFormState>({
        messenger_name: "",
        primary_mobile: "",
        email: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [guestTotal, setGuestTotal] = useState(0);
    const [guestLoading, setGuestLoading] = useState(false);

    const [networkTotal, setNetworkTotal] = useState(0);
    const [networkLoading, setNetworkLoading] = useState(false);

    const [messengerTotal, setMessengerTotal] = useState(0);
    const [messengerLoading, setMessengerLoading] = useState(false);


    /* ================= PREFILL EFFECTS ================= */
    useEffect(() => {
        if (editNetwork) {
            setNetworkForm({
                provider_name: editNetwork.provider_name,
                provider_name_local_language:
                    editNetwork.provider_name_local_language || "",
                network_type: editNetwork.network_type,
                bandwidth_mbps: editNetwork.bandwidth_mbps
                    ? String(editNetwork.bandwidth_mbps)
                    : "",
                username: editNetwork.username || "",
                password: "", // never prefill passwords
                static_ip: editNetwork.static_ip || "",
                address: editNetwork.address || "",
            });
        }
    }, [editNetwork]);

    useEffect(() => {
        if (editMessenger) {
            setMessengerEditForm({
                messenger_name: editMessenger.messenger_name,
                primary_mobile: editMessenger.primary_mobile,
                email: editMessenger.email || "",
            });
        }
    }, [editMessenger]);

    useEffect(() => {
        if (editGuest) {
            setGuestForm({
                guest_name: editGuest.guest_name,
                network_status: (editGuest.network_status as GuestNetwork['network_status']) || "",
            });
        }
    }, [editGuest]);

    // useEffect(() => {
    //     async function loadRooms() {
    //         const res = await getActiveRooms();
    //         setRooms(res);
    //     }

    //     loadRooms();
    // }, []);

    async function loadGuestNetwork() {
        setGuestLoading(true);

        const res = await getGuestNetworkTable({
            page: guestTable.query.page,
            limit: guestTable.query.limit,
            sortBy: ["guest_name", "network_status"].includes(guestTable.query.sortBy)
                ? guestTable.query.sortBy
                : "guest_name" as any,
            sortOrder: guestTable.query.sortOrder,
            search: guestTable.query.search,
        });

        setGuestRows(res.data);
        setGuestTotal(res.totalCount);
        setGuestLoading(false);
    }

    async function loadNetworks() {
        setNetworkLoading(true);

        const res = await getNetworkTable({
            page: networkTable.query.page,
            limit: networkTable.query.limit,
            sortBy: [
                "provider_name",
                "network_type",
                "bandwidth_mbps",
            ].includes(networkTable.query.sortBy)
                ? networkTable.query.sortBy
                : "provider_name" as any,

            sortOrder: networkTable.query.sortOrder,
        });

        setNetworks(res.data);
        setNetworkTotal(res.totalCount);
        setNetworkLoading(false);
    }

    async function loadMessengers() {
        setMessengerLoading(true);

        const res = await getMessengerTable({
            page: messengerTable.query.page,
            limit: messengerTable.query.limit,
            sortBy: [
                "messenger_name",
                "primary_mobile",
                "email",
            ].includes(messengerTable.query.sortBy)
                ? messengerTable.query.sortBy
                : "messenger_name" as any,
            sortOrder: messengerTable.query.sortOrder,
            status: "active",
        });

        setMessengers(res.data);
        setMessengerTotal(res.totalCount);
        setMessengerLoading(false);
    }

    /* ================= ASSIGN MESSENGER HANDLER ================= */
    async function handleAssignMessenger() {
        if (!selectedGuest || !assignForm.assigned_to) {
            return;
        }

        await createGuestMessenger({
            guest_id: selectedGuest.guest_id,
            messenger_id: assignForm.assigned_to,
            assignment_date: new Date().toISOString().slice(0, 10),
            remarks: assignForm.admin_remark,
        });

        setAssignModal(false);
        setAssignForm({ assigned_to: "", admin_remark: "" });
        setAssignForm({ assigned_to: "", admin_remark: "" });
        await loadGuestNetwork();
        guestTable.setPage(1);
    }

    /* ================= ADD MESSENGER HANDLER (with Zod) ================= */
    async function handleAddMessenger() {
        setFormErrors({});

        try {
            const parsed = messengerCreateSchema.parse(messengerForm);

            await createMessenger({
                messenger_name: parsed.messenger_name,
                primary_mobile: parsed.primary_mobile,
                email: parsed.email || undefined,
            });

            setShowAddMessenger(false);
            setMessengerForm({
                messenger_name: "",
                primary_mobile: "",
                email: "",
            });
            await loadMessengers();

        } catch (err) {
            if (err instanceof ZodError) {
                const errors: Record<string, string> = {};
                err.issues.forEach(issue => {
                    errors[issue.path[0] as string] = issue.message;
                });
                setFormErrors(errors);
            }
        }
    }


    /* ================= LOADERS ================= */
    useEffect(() => {
        loadGuestNetwork();
    }, [guestTable.query]);

    useEffect(() => {
        loadNetworks();
    }, [networkTable.query]);

    useEffect(() => {
        loadMessengers();
    }, [messengerTable.query]);

    /* ================= COLUMN DEFINITIONS ================= */

    const guestNetworkColumns: Column<GuestNetworkView>[] = [
        {
            header: "Guest",
            accessor: "guest_name",
            sortable: true,
            sortKey: "guest_name",
        },
        {
            header: "Room",
            render: (row) => row.room_id || "—",
        },
        {
            header: "Provider",
            render: (row) => row.provider_name || "—",
        },
        {
            header: "Status",
            render: (row) => {
                const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

                if (!row.network_status && !row.messenger_status) {
                    return "—";
                }

                if (row.network_status === "Active") {
                    return (
                        <span className={`${base} bg-green-100 text-green-800`}>
                            Network Active
                        </span>
                    );
                }

                if (row.messenger_status) {
                    return (
                        <span className={`${base} bg-blue-100 text-blue-800`}>
                            Messenger Assigned
                        </span>
                    );
                }

                return (
                    <span className={`${base} bg-red-100 text-red-800`}>
                        {row.network_status}
                    </span>
                );
            },
        },
        {
            header: "Actions",
            render: (row) => (
                <div className="flex items-center gap-3">
                    {/* View */}
                    <button
                        className="icon-btn text-blue-600"
                        title="View Details"
                        onClick={() => setViewGuestNetwork(row)}
                    >
                        <Eye size={16} />
                    </button>

                    {/* Assign Messenger */}
                    <button
                        className="icon-btn text-purple-600"
                        title="Assign Messenger"
                        onClick={() => {
                            setSelectedGuest(row);
                            setAssignModal(true);
                        }}
                    >
                        <User size={16} />
                    </button>

                    <button
                        className="icon-btn text-green-600"
                        title="Edit Guest Network"
                        onClick={() => setEditGuest(row)}
                    >
                        <Edit size={16} />
                    </button>

                    {/* Unassign Messenger */}
                    {row.guest_messenger_id && (
                        <button
                            className="icon-btn text-red-600"
                            title="Unassign Messenger"
                            onClick={async () => {
                                await unassignGuestMessenger(row.guest_messenger_id!);
                                await loadGuestNetwork();
                                guestTable.setPage(1);
                            }}
                        >
                            <XCircle size={16} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const networkColumns: Column<NetworkProvider>[] = [
        {
            header: "Provider",
            accessor: "provider_name",
            sortable: true,
            sortKey: "provider_name",
        },
        {
            header: "Type",
            accessor: "network_type",
        },
        {
            header: "Bandwidth",
            accessor: "bandwidth_mbps",
            render: (row) => row.bandwidth_mbps ? `${row.bandwidth_mbps} Mbps` : "—",
        },
        {
            header: "Actions",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <button
                        className="icon-btn text-blue-600"
                        title="View Network"
                        onClick={() => setViewNetwork(row)}
                    >
                        <Eye size={16} />
                    </button>

                    <button
                        className="icon-btn text-green-600"
                        title="Edit"

                        onClick={() => {
                            setIsAddNetwork(false);
                            setEditNetwork(row);
                            setNetworkModalOpen(true);
                        }}
                    >
                        <Edit size={16} />
                    </button>

                    <button
                        className="icon-btn text-red-600"
                        title="Delete"
                        onClick={async () => {
                            setDeleteError(null);

                            try {
                                await softDeleteNetwork(row.provider_id);
                                loadNetworks();
                            } catch (err: any) {
                                const message =
                                    err?.response?.data?.message ||
                                    "Unable to delete network provider";

                                setDeleteError(message);
                            }
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    const messengerColumns: Column<Messenger>[] = [
        {
            header: "Name",
            accessor: "messenger_name",
            sortable: true,
            sortKey: "messenger_name",
        },
        {
            header: "Contact",
            accessor: "primary_mobile",
        },
        {
            header: "Email",
            accessor: "email",
            render: (row) => row.email || "—",
        },
        {
            header: "Actions",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <button
                        className="icon-btn text-blue-600"
                        title="View Messenger"
                        onClick={() => setViewMessenger(row)}
                    >
                        <Eye size={16} />
                    </button>

                    <button
                        className="icon-btn text-green-600"
                        title="Edit"
                        onClick={() => setEditMessenger(row)}
                    >
                        <Edit size={16} />
                    </button>

                    <button
                        className="icon-btn text-red-600"
                        title="Delete"
                        onClick={async () => {
                            setDeleteError(null);

                            try {
                                await softDeleteMessenger(row.messenger_id);
                                loadMessengers();
                            } catch (err: any) {
                                const message =
                                    err?.response?.data?.message ||
                                    "Unable to delete messenger";

                                setDeleteError(message);
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

            {/* TABS */}
            <div className="nicTabs">
                <button
                    className={`nicTab ${activeTab === "guestMng" ? "active" : ""}`}
                    onClick={() => { setActiveTab("guestMng"); }}
                >
                    Guest Network
                </button>

                <button
                    className={`nicTab ${activeTab === "networks" ? "active" : ""}`}
                    onClick={() => { setActiveTab("networks"); setDeleteError(null); }}
                >
                    Networks
                </button>

                <button
                    className={`nicTab ${activeTab === "messengers" ? "active" : ""}`}
                    onClick={() => { setActiveTab("messengers"); setDeleteError(null); }}
                >
                    Messengers
                </button>
            </div>


            {/* ================= TAB 1: GUEST NETWORK ================= */}
            {activeTab === "guestMng" && (
                <>
                    <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                                placeholder="Search guest, room, network..."
                                value={guestTable.query.search ?? ""}
                                onChange={(e) => guestTable.setSearchInput(e.target.value)}
                                maxLength={300}
                            />
                        </div>
                    </div>

                    <div className="bg-white border rounded-sm overflow-hidden">
                        <DataTable
                            data={guestRows}
                            columns={guestNetworkColumns}
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
                </>
            )}

            {/* ================= TAB 2: NETWORKS ================= */}
            {activeTab === "networks" && (
                <>
                    <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                                placeholder="Search provider, type, bandwidth..."
                                value={networkTable.query.search ?? ""}
                                onChange={(e) => networkTable.setSearchInput(e.target.value)}
                                maxLength={300}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => {
                                    setIsAddNetwork(true);
                                    setEditNetwork(null);
                                    setNetworkForm({
                                        provider_name: "",
                                        provider_name_local_language: "",
                                        network_type: "WiFi",
                                        bandwidth_mbps: "",
                                        username: "",
                                        password: "",
                                        static_ip: "",
                                        address: "",
                                    });
                                    setNetworkModalOpen(true);
                                }}
                                className="bg-[#00247D] hover:bg-[#003399] text-white btn-icon-text h-10 px-4"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Network
                            </Button>
                        </div>
                    </div>
                    {deleteError && (
                        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {deleteError}
                        </div>
                    )}
                    <div className="bg-white border rounded-sm overflow-hidden">

                        <DataTable
                            data={networks}
                            columns={networkColumns}
                            keyField="provider_id"
                            page={networkTable.query.page}
                            limit={networkTable.query.limit}
                            totalCount={networkTotal}
                            sortBy={networkTable.query.sortBy}
                            sortOrder={networkTable.query.sortOrder}
                            loading={networkLoading}
                            onPageChange={networkTable.setPage}
                            onLimitChange={networkTable.setLimit}
                            onSortChange={networkTable.setSort}
                        />
                    </div>
                </>
            )}

            {/* ================= TAB 3: MESSENGERS ================= */}
            {activeTab === "messengers" && (
                <>
                    <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                className="pl-10 pr-3 py-2 w-full border rounded-sm"
                                placeholder="Search messenger..."
                                value={messengerTable.query.search ?? ""}
                                onChange={(e) => messengerTable.setSearchInput(e.target.value)}
                                maxLength={300}
                            />
                        </div>

                        <Button
                            onClick={() => setShowAddMessenger(true)}
                            className="bg-[#00247D] hover:bg-[#003399] text-white btn-icon-text"
                        >
                            <Plus className="w-4 h-4" />
                            Add Messenger
                        </Button>
                    </div>
                    {deleteError && (
                        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {deleteError}
                        </div>
                    )}
                    <div className="bg-white border rounded-sm overflow-hidden">
                        <DataTable
                            data={messengers}
                            columns={messengerColumns}
                            keyField="messenger_id"
                            page={messengerTable.query.page}
                            limit={messengerTable.query.limit}
                            totalCount={messengerTotal}
                            sortBy={messengerTable.query.sortBy}
                            sortOrder={messengerTable.query.sortOrder}
                            loading={messengerLoading}
                            onPageChange={messengerTable.setPage}
                            onLimitChange={messengerTable.setLimit}
                            onSortChange={messengerTable.setSort}
                        />
                    </div>
                </>
            )}

            {/* ================= VIEW GUEST NETWORK MODAL ================= */}
            {viewGuestNetwork && (
                <div className="modalOverlay">
                    <div className="nicModal wide">

                        <div className="nicModalHeader">
                            <h2>Guest Network Details</h2>
                            <button
                                className="closeBtn"
                                onClick={() => setViewGuestNetwork(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="nicModalBody">
                            <div className="detailGridHorizontal">

                                <div className="detailSection">
                                    <h4>Guest</h4>
                                    <p><b>Name:</b> {viewGuestNetwork.guest_name}</p>
                                    <p><b>Room:</b> {viewGuestNetwork.room_id || "—"}</p>
                                </div>

                                <div className="detailSection">
                                    <h4>Network</h4>
                                    <p><b>Provider:</b> {viewGuestNetwork.provider_name || "—"}</p>
                                    <p><b>Status:</b> {viewGuestNetwork.network_status || "—"}</p>
                                </div>

                                <div className="detailSection">
                                    <h4>Messenger</h4>
                                    <p><b>Status:</b> {viewGuestNetwork.messenger_status || "—"}</p>
                                </div>

                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => setViewGuestNetwork(null)}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ================= VIEW NETWORK MODAL ================= */}
            {viewNetwork && (
                <div className="modalOverlay">
                    <div className="nicModal wide">

                        <div className="nicModalHeader">
                            <h2>Network Details</h2>
                            <button
                                className="closeBtn"
                                onClick={() => setViewNetwork(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="nicModalBody">
                            <div className="detailGridHorizontal">

                                <div className="detailSection">
                                    <h4>Provider Info</h4>
                                    <p><b>Name:</b> {viewNetwork.provider_name}</p>
                                    <p><b>Type:</b> {viewNetwork.network_type || "—"}</p>
                                    <p><b>Bandwidth:</b> {viewNetwork.bandwidth_mbps ? `${viewNetwork.bandwidth_mbps} Mbps` : "—"}</p>
                                </div>

                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => setViewNetwork(null)}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ================= VIEW MESSENGER MODAL ================= */}
            {viewMessenger && (
                <div className="modalOverlay">
                    <div className="nicModal wide">

                        <div className="nicModalHeader">
                            <h2>Messenger Details</h2>
                            <button
                                className="closeBtn"
                                onClick={() => setViewMessenger(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="nicModalBody">
                            <div className="detailGridHorizontal">

                                <div className="detailSection">
                                    <h4>Basic Info</h4>
                                    <p><b>Name:</b> {viewMessenger.messenger_name}</p>
                                    <p><b>Mobile:</b> {viewMessenger.primary_mobile}</p>
                                    <p><b>Email:</b> {viewMessenger.email || "—"}</p>
                                </div>

                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => setViewMessenger(null)}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ================= ASSIGN MESSENGER MODAL ================= */}
            {assignModal && selectedGuest && (
                <div className="modalOverlay">
                    <div className="nicModal">
                        <div className="nicModalHeader">
                            <h2>Assign Messenger</h2>
                            <button className="closeBtn" onClick={() => setAssignModal(false)}>✕</button>
                        </div>

                        <div className="nicModalBody">
                            <div className="nicFormStack">
                                <div>
                                    <label className="nicLabel">
                                        Messenger <span className="nicRequired">*</span>
                                    </label>
                                    <select
                                        className="nicInput"
                                        value={assignForm.assigned_to}
                                        onChange={(e) =>
                                            setAssignForm({ ...assignForm, assigned_to: e.target.value })
                                        }
                                    >
                                        <option value="">Select Messenger</option>
                                        {messengers.map((m) => (
                                            <option key={m.messenger_id} value={m.messenger_id}>
                                                {m.messenger_name}
                                            </option>
                                        ))}
                                    </select>
                                    {!assignForm.assigned_to && (
                                        <p className="errorText">Messenger is required</p>
                                    )}
                                </div>

                                <div>
                                    <label className="nicLabel">Admin Remark</label>
                                    <textarea
                                        className="nicInput"
                                        rows={3}
                                        value={assignForm.admin_remark}
                                        onChange={(e) =>
                                            setAssignForm({ ...assignForm, admin_remark: e.target.value })
                                        }
                                        placeholder="Optional notes..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button className="cancelBtn" onClick={() => setAssignModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="saveBtn"
                                onClick={handleAssignMessenger}
                                disabled={!assignForm.assigned_to}
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= ADD MESSENGER MODAL ================= */}
            {showAddMessenger && (
                <div className="modalOverlay">
                    <div className="nicModal">

                        <div className="nicModalHeader">
                            <h2>Add Messenger</h2>
                            <button
                                className="closeBtn"
                                onClick={() => {
                                    setShowAddMessenger(false);
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
                                        value={messengerForm.messenger_name}
                                        onChange={(e) =>
                                            setMessengerForm({
                                                ...messengerForm,
                                                messenger_name: e.target.value,
                                            })
                                        }
                                        maxLength={50}
                                    />
                                    {formErrors.messenger_name && (
                                        <p className="errorText">{formErrors.messenger_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="nicLabel">
                                        Mobile <span className="nicRequired">*</span>
                                    </label>
                                    <input
                                        className="nicInput"
                                        value={messengerForm.primary_mobile}
                                        maxLength={10}
                                        onChange={(e) =>
                                            setMessengerForm({
                                                ...messengerForm,
                                                primary_mobile: e.target.value.replace(/\D/g, ''),
                                            })
                                        }
                                    />
                                    {formErrors.primary_mobile && (
                                        <p className="errorText">{formErrors.primary_mobile}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="nicLabel">Email</label>
                                    <input
                                        className="nicInput"
                                        value={messengerForm.email}
                                        onChange={(e) =>
                                            setMessengerForm({
                                                ...messengerForm,
                                                email: e.target.value,
                                            })
                                        }
                                    />
                                    {formErrors.email && (
                                        <p className="errorText">{formErrors.email}</p>
                                    )}
                                </div>

                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => {
                                    setShowAddMessenger(false);
                                    setFormErrors({});
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="saveBtn"
                                onClick={handleAddMessenger}
                            >
                                Save
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {networkModalOpen && (
                <div className="modalOverlay">
                    <div className="nicModal wide">

                        <div className="nicModalHeader">
                            <h2>
                                {isAddNetwork ? "Add Network Provider" : "Edit Network Provider"}
                            </h2>
                            <button onClick={() => setNetworkModalOpen(false)}>✕</button>
                        </div>

                        <div className="nicFormStack">

                            <div>
                                <label className="nicLabel">
                                    Provider Name <span className="required">*</span>
                                </label>
                                <input
                                    className="nicInput"
                                    value={networkForm.provider_name}
                                    onChange={(e) =>
                                        setNetworkForm({ ...networkForm, provider_name: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="nicLabel">Provider Name (Local Language)</label>
                                <input
                                    className="nicInput"
                                    value={networkForm.provider_name_local_language}
                                    onChange={(e) =>
                                        setNetworkForm({
                                            ...networkForm,
                                            provider_name_local_language: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="nicLabel">
                                    Network Type <span className="required">*</span>
                                </label>
                                <select
                                    className="nicInput"
                                    value={networkForm.network_type}
                                    onChange={(e) =>
                                        setNetworkForm({
                                            ...networkForm,
                                            network_type: e.target.value as any,
                                        })
                                    }
                                >
                                    <option value="WiFi">WiFi</option>
                                    <option value="Broadband">Broadband</option>
                                    <option value="Hotspot">Hotspot</option>
                                    <option value="Leased-Line">Leased-Line</option>
                                </select>
                            </div>

                            <div>
                                <label className="nicLabel">Bandwidth (Mbps)</label>
                                <input
                                    type="number"
                                    className="nicInput"
                                    value={networkForm.bandwidth_mbps}
                                    onChange={(e) =>
                                        setNetworkForm({
                                            ...networkForm,
                                            bandwidth_mbps: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="nicLabel">Username</label>
                                <input
                                    className="nicInput"
                                    value={networkForm.username}
                                    onChange={(e) =>
                                        setNetworkForm({ ...networkForm, username: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="nicLabel">Password</label>
                                <input
                                    type="password"
                                    className="nicInput"
                                    value={networkForm.password}
                                    onChange={(e) =>
                                        setNetworkForm({ ...networkForm, password: e.target.value })
                                    }
                                    placeholder={
                                        !isAddNetwork
                                            ? "Leave blank to keep existing password"
                                            : ""
                                    }
                                />
                            </div>

                            <div>
                                <label className="nicLabel">Static IP</label>
                                <input
                                    className="nicInput"
                                    value={networkForm.static_ip}
                                    onChange={(e) =>
                                        setNetworkForm({ ...networkForm, static_ip: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="nicLabel">Address</label>
                                <textarea
                                    className="nicInput"
                                    rows={2}
                                    value={networkForm.address}
                                    onChange={(e) =>
                                        setNetworkForm({ ...networkForm, address: e.target.value })
                                    }
                                />
                            </div>

                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => {
                                    setNetworkModalOpen(false);
                                    setEditNetwork(null);
                                }}
                            >
                                Cancel
                            </button>

                            {/* SAVE */}
                            <button
                                className="saveBtn"
                                onClick={async () => {
                                    const payload = {
                                        provider_name: networkForm.provider_name,
                                        provider_name_local_language:
                                            networkForm.provider_name_local_language || undefined,
                                        network_type: networkForm.network_type,
                                        bandwidth_mbps: networkForm.bandwidth_mbps
                                            ? Number(networkForm.bandwidth_mbps)
                                            : undefined,
                                        username: networkForm.username || undefined,
                                        password: networkForm.password || undefined,
                                        static_ip: networkForm.static_ip || undefined,
                                        address: networkForm.address || undefined,
                                    };

                                    try {
                                        if (editNetwork?.provider_id) {
                                            await updateNetwork(editNetwork.provider_id, payload);
                                        } else {
                                            await createNetwork(payload);
                                        }

                                        setNetworkModalOpen(false);
                                        setEditNetwork(null);
                                        await loadNetworks();
                                        networkTable.setPage(1);
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }}
                            >
                                Save
                            </button>

                            {/* SAVE & ADD NEW */}
                            {!editNetwork?.provider_id && (
                                <button
                                    className="saveBtn"
                                    onClick={async () => {
                                        const payload = {
                                            provider_name: networkForm.provider_name,
                                            provider_name_local_language:
                                                networkForm.provider_name_local_language || undefined,
                                            network_type: networkForm.network_type,
                                            bandwidth_mbps: networkForm.bandwidth_mbps
                                                ? Number(networkForm.bandwidth_mbps)
                                                : undefined,
                                            username: networkForm.username || undefined,
                                            password: networkForm.password || undefined,
                                            static_ip: networkForm.static_ip || undefined,
                                            address: networkForm.address || undefined,
                                        };

                                        try {
                                            await createNetwork(payload);

                                            // reset form for next entry
                                            setNetworkForm({
                                                provider_name: "",
                                                provider_name_local_language: "",
                                                network_type: "WiFi",
                                                bandwidth_mbps: "",
                                                username: "",
                                                password: "",
                                                static_ip: "",
                                                address: "",
                                            });

                                            await loadNetworks();
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}
                                >
                                    Save & Add New
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* ================= FIX 5: EDIT MESSENGER MODAL ================= */}
            {editMessenger && (
                <div className="modalOverlay">
                    <div className="nicModal">

                        <div className="nicModalHeader">
                            <h2>Edit Messenger</h2>
                            <button onClick={() => setEditMessenger(null)}>✕</button>
                        </div>

                        <div className="nicFormStack">
                            <div>
                                <label className="nicLabel">
                                    Name <span className="required">*</span>
                                </label>
                                <input
                                    className="nicInput"
                                    value={messengerEditForm.messenger_name}
                                    onChange={(e) =>
                                        setMessengerEditForm({
                                            ...messengerEditForm,
                                            messenger_name: e.target.value,
                                        })
                                    }
                                    onBlur={() => validateField(messengerCreateSchema, "messenger_name", messengerEditForm.messenger_name, setFormErrors)}
                                />
                            </div>

                            <div>
                                <label className="nicLabel">
                                    Mobile <span className="required">*</span>
                                </label>
                                <input
                                    className="nicInput"
                                    value={messengerEditForm.primary_mobile}
                                    onChange={(e) =>
                                        setMessengerEditForm({
                                            ...messengerEditForm,
                                            primary_mobile: e.target.value,
                                        })
                                    }
                                    onBlur={() => validateField(messengerCreateSchema, "primary_mobile", messengerEditForm.primary_mobile, setFormErrors)}
                                />
                            </div>

                            <div>
                                <label className="nicLabel">Email</label>
                                <input
                                    className="nicInput"
                                    value={messengerEditForm.email}
                                    onChange={(e) =>
                                        setMessengerEditForm({
                                            ...messengerEditForm,
                                            email: e.target.value,
                                        })
                                    }
                                    onBlur={() => validateField(messengerCreateSchema, "email", messengerEditForm.email, setFormErrors)}
                                />
                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button className="cancelBtn" onClick={() => setEditMessenger(null)}>
                                Cancel
                            </button>
                            <button
                                className="saveBtn"
                                onClick={async () => {
                                    await updateMessenger(editMessenger.messenger_id, messengerEditForm);
                                    setEditMessenger(null);
                                    loadMessengers();
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ================= EDIT GUEST MODAL ================= */}
            {editGuest && (
                <div className="modalOverlay">
                    <div className="nicModal">
                        <div className="nicModalHeader">
                            <h2>Edit Guest Network</h2>
                            <button onClick={() => setEditGuest(null)}>✕</button>
                        </div>
                        <div className="nicFormStack">
                            <div>
                                <label className="nicLabel">Guest Name</label>
                                <input
                                    className="nicInput"
                                    value={guestForm.guest_name}
                                    disabled
                                />
                            </div>
                            {/* <div>
                                <label className="nicLabel">Room</label>
                                <input
                                    className="nicInput"
                                    value={guestForm.room_id}
                                    onChange={(e) => setGuestForm({ ...guestForm, room_id: e.target.value })}
                                />
                            </div> */}
                            <div>
                            <label className="nicLabel">Room</label>
                            <input
                                className="nicInput"
                                value={editGuest?.room_no || "—"}
                                disabled
                            />
                            </div>
                            <div>
                                <label className="nicLabel">
                                    Network Status <span className="required">*</span>
                                </label>
                                <select
                                    className="nicInput"
                                    value={guestForm.network_status}
                                    onChange={(e) => setGuestForm({ ...guestForm, network_status: e.target.value as GuestNetwork['network_status'] })}
                                >
                                    <option value="Requested">Requested</option>
                                    <option value="Connected">Connected</option>
                                    <option value="Disconnected">Disconnected</option>
                                    <option value="Issue-Reported">Issue Reported</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="nicModalActions">
                            <button className="cancelBtn" onClick={() => setEditGuest(null)}>Cancel</button>
                            <button
                                className="saveBtn"
                                onClick={async () => {
                                    try {
                                        if (editGuest?.guest_network_id) {
                                            // UPDATE existing guest network
                                            await updateGuestNetwork(editGuest.guest_network_id, {
                                                network_status: guestForm.network_status,
                                            });
                                        } else {
                                            // CREATE new guest network (because it does not exist yet)
                                            await createGuestNetwork({
                                                guest_id: editGuest!.guest_id,
                                                network_status: guestForm.network_status as GuestNetwork['network_status'],

                                                // REQUIRED fields for CreateGuestNetworkDto
                                                provider_id: "N001", // <-- replace with actual default or selected provider
                                                start_date: new Date().toISOString().slice(0, 10),
                                                start_time: new Date().toISOString().slice(11, 16),
                                            });
                                        }

                                        await loadGuestNetwork();
                                        setEditGuest(null);

                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
