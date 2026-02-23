'use client';
import { useEffect, useState } from "react";
import { Plus, Eye, Edit, User, XCircle, Trash2, Search, Wifi, Users, Router, ShieldAlert, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZodError } from "zod";
import "./NetworkManagement.css";
import { StatCard } from "@/components/ui/StatCard";
import { getNetworkTable, softDeleteNetwork, updateNetwork, createNetwork } from "@/api/network.api";
import { getMessengerTable, softDeleteMessenger, createMessenger, updateMessenger } from "@/api/messenger.api";
import { getGuestNetworkTable, createGuestNetwork, getActiveProviders, closeGuestNetwork } from "@/api/guestNetwork.api";
import { unassignGuestMessenger, createGuestMessenger } from "@/api/guestMessenger.api";
import { NetworkProvider } from "@/types/network";
import { Messenger } from "@/types/messenger";
import { GuestNetwork } from "@/types/guestNetwork";
import { useTableQuery } from "@/hooks/useTableQuery";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";
import { messengerSchema } from "@/validation/messenger.validation";
import { networkProviderSchema } from "@/validation/network.validation";
import { validateSingleField as validateField } from "@/utils/validateSingleField";
import { FieldError } from "@/components/ui/FieldError";
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

    provider_id: string | null;
    username: string | null;
    guest_network_id: string | null;
    provider_name: string | null;
    network_status: string | null;

    remarks: string | null;

    guest_messenger_id: string | null;
    messenger_status: string | null;
};

type MessengerFormState = {
    messenger_name: string;
    messenger_name_local_language: string;
    primary_mobile: string;
    secondary_mobile: string;
    email: string;
    designation: string;
    remarks: string;
};

export default function NetworkManagement() {

    const [activeTab, setActiveTab] = useState<"guestMng" | "networks" | "messengers">("guestMng");

    // Guest Network
    const guestTable = useTableQuery({
        prefix: "guest",
        sortBy: "guest_name",
        sortOrder: "asc",
    });

    const networkTable = useTableQuery({
        prefix: "network",
        sortBy: "provider_name",
        sortOrder: "asc",
        status: "all",
    });

    const messengerTable = useTableQuery({
        prefix: "messenger",
        sortBy: "messenger_name",
        sortOrder: "asc",
    });
    const [deleteError, setDeleteError] = useState<string | null>(null);

    /* ================= GUEST NETWORK ================= */
    const [networks, setNetworks] = useState<NetworkProvider[]>([]);
    const [activeProviders, setActiveProviders] = useState<NetworkProvider[]>([]);
    // const [rooms, setRooms] = useState<any[]>([]);
    const [guestRows, setGuestRows] = useState<GuestNetworkView[]>([]);
    const [assignModal, setAssignModal] = useState(false);
    const [assignTouched, setAssignTouched] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<GuestNetworkView | null>(null);

    const [assignForm, setAssignForm] = useState<AssignMessengerForm>({
        assigned_to: "",
        admin_remark: "",
    });

    /* ================= VIEW MODALS ================= */
    const [viewGuestNetwork, setViewGuestNetwork] = useState<GuestNetworkView | null>(null);
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

    const [messengerEditForm, setMessengerEditForm] = useState<MessengerFormState>({
        messenger_name: "",
        messenger_name_local_language: "",
        primary_mobile: "",
        secondary_mobile: "",
        email: "",
        designation: "",
        remarks: "",
    });

    type GuestNetworkEditForm = {
        provider_id: string;
        remarks: string;
    };

    const [editGuest, setEditGuest] = useState<GuestNetworkView | null>(null);
    const [guestForm, setGuestForm] = useState<GuestNetworkEditForm>({
        provider_id: "",
        remarks: "",
    });
    /* ================= MESSENGERS ================= */
    const [messengers, setMessengers] = useState<Messenger[]>([]);
    const [showAddMessenger, setShowAddMessenger] = useState(false);
    const [messengerForm, setMessengerForm] = useState<MessengerFormState>({
        messenger_name: "",
        messenger_name_local_language: "",
        primary_mobile: "",
        secondary_mobile: "",
        email: "",
        designation: "",
        remarks: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [guestTotal, setGuestTotal] = useState(0);
    const [guestLoading, setGuestLoading] = useState(false);

    const [networkTotal, setNetworkTotal] = useState(0);
    const [networkLoading, setNetworkLoading] = useState(false);

    const [messengerTotal, setMessengerTotal] = useState(0);
    const [messengerLoading, setMessengerLoading] = useState(false);

    /* ================= STATS STATE ================= */
    const [guestStats, setGuestStats] = useState({
        total: 0,
        requested: 0,
        connected: 0,
        disconnected: 0,
        issueReported: 0,
        resolved: 0,
        cancelled: 0,
        messengerAssigned: 0,
    });
    const [networkStats, setNetworkStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        wifi: 0,
        broadband: 0,
        hotspot: 0,
        leasedLine: 0,
    });
    const [messengerStats, setMessengerStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        assigned: 0,
        unassigned: 0,
    });
    function applyNetworkStatus(status: "all" | "active" | "inactive") {
        networkTable.setPage(1);
        networkTable.setStatus(status);
        networkTable.setNetworkType?.(undefined);
    }
    function applyNetworkType(type?: NetworkProvider["network_type"]) {
        networkTable.setPage(1);
        networkTable.setNetworkType?.(type);
    }
    function applyMessengerStatus(
        status: 'active' | 'inactive' | 'assigned' | 'unassigned'
    ) {
        messengerTable.setPage(1);
        messengerTable.setStatus(status);

    }
    const resetNetworkForm = () => {
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

        setEditNetwork(null);
        setIsAddNetwork(false);
        setFormErrors({});
    };
    /* ================= PREFILL EFFECTS ================= */
    useEffect(() => {
        if (editMessenger) {
            setMessengerEditForm({
                messenger_name: editMessenger.messenger_name,
                messenger_name_local_language:
                    editMessenger.messenger_name_local_language || "",
                primary_mobile: editMessenger.primary_mobile,
                secondary_mobile: editMessenger.secondary_mobile || "",
                email: editMessenger.email || "",
                designation: editMessenger.designation || "",
                remarks: editMessenger.remarks || "",
            });
        }
    }, [editMessenger]);
    useEffect(() => {
        if (editGuest) {
            setGuestForm({
                provider_id: editGuest.provider_id || "",
                remarks: editGuest.remarks || "",
            });
        }
    }, [editGuest]);
    // useEffect(() => {
    //     if (editGuest) {
    //         setGuestForm({
    //             guest_name: editGuest.guest_name,
    //             room_no: editGuest.room_no || "—",

    //             start_date: editGuest.start_date || "",
    //             start_time: editGuest.start_time || "",
    //             end_date: editGuest.end_date || "",
    //             end_time: editGuest.end_time || "",

    //             network_status: (editGuest.network_status as GuestNetwork['network_status']) || "",
    //             start_status: (editGuest.start_status as "Waiting" | "Success") || "",
    //             remarks: editGuest.remarks || "",
    //         });
    //     }
    // }, [editGuest]);
    useEffect(() => {
        if (editNetwork) {
            setNetworkForm({
                provider_name: editNetwork.provider_name || "",
                provider_name_local_language: editNetwork.provider_name_local_language || "",
                network_type: editNetwork.network_type || "WiFi",
                bandwidth_mbps: editNetwork.bandwidth_mbps?.toString() || "",
                username: editNetwork.username || "",
                password: "", // leave empty for security
                static_ip: editNetwork.static_ip || "",
                address: editNetwork.address || "",
            });
        }
    }, [editNetwork]);
    useEffect(() => {
        loadActiveProviders();
    }, []);
    async function loadGuestNetwork() {
        setGuestLoading(true);

        try {
            const res = await getGuestNetworkTable({
                page: guestTable.query.page,
                limit: guestTable.query.limit,
                sortBy: ["guest_name", "network_status"].includes(guestTable.query.sortBy)
                    ? guestTable.query.sortBy
                    : "guest_name" as any,
                sortOrder: guestTable.query.sortOrder,
                search: guestTable.query.search,
            });

            setGuestRows(res?.data ?? []);
            setGuestTotal(res?.totalCount ?? 0);
            setGuestStats(res?.stats ?? {
                total: 0,
                requested: 0,
                connected: 0,
                disconnected: 0,
                issueReported: 0,
                resolved: 0,
                cancelled: 0,
                messengerAssigned: 0,
            });

        } catch (err) {
            console.error("Guest network load failed:", err);
            setGuestRows([]);
            setGuestTotal(0);
        } finally {
            setGuestLoading(false);
        }
    }
    async function loadActiveProviders() {
        try {
            const res = await getActiveProviders();
            setActiveProviders(res ?? []);
        } catch (err) {
            console.error("Failed to load active providers:", err);
            setActiveProviders([]);
        }
    }
    async function loadNetworks() {
        setNetworkLoading(true);

        try {
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
                status: networkTable.query.status as any,
                search: networkTable.query.search,
                networkType: networkTable.query.networkType,
            });

            setNetworks(res?.data ?? []);
            setNetworkTotal(res?.totalCount ?? 0);

            setNetworkStats({
                total: res?.stats?.total ?? 0,
                active: res?.stats?.active ?? 0,
                inactive: res?.stats?.inactive ?? 0,
                wifi: res?.stats?.wifi ?? 0,
                broadband: res?.stats?.broadband ?? 0,
                hotspot: res?.stats?.hotspot ?? 0,
                leasedLine: res?.stats?.leasedLine ?? 0,
            });

        } catch (err) {
            console.error("Network load failed:", err);
            setNetworks([]);
            setNetworkTotal(0);
        } finally {
            setNetworkLoading(false);
        }
    }


    // async function loadMessengers() {
    //     setMessengerLoading(true);

    //     const res = await getMessengerTable({
    //         page: messengerTable.query.page,
    //         limit: messengerTable.query.limit,
    //         sortBy: [
    //             "messenger_name",
    //             "primary_mobile",
    //             "email",
    //         ].includes(messengerTable.query.sortBy)
    //             ? messengerTable.query.sortBy
    //             : "messenger_name" as any,

    //         sortOrder: messengerTable.query.sortOrder,
    //         status: messengerTable.query.status as "active" | "inactive" | "assigned" | "unassigned" | undefined,
    //     });

    //     setMessengers(res.data);
    //     setMessengerTotal(res.totalCount);
    //     setMessengerStats(res.stats);
    //     setMessengerLoading(false);
    // }
    async function loadMessengers() {
        setMessengerLoading(true);

        try {
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
                status: messengerTable.query.status as any,
                search: messengerTable.query.search,   // 👈 ADD THIS
            });

            setMessengers(res?.data ?? []);
            setMessengerTotal(res?.totalCount ?? 0);
            setMessengerStats(res?.stats ?? {
                total: 0,
                active: 0,
                inactive: 0,
                assigned: 0,
                unassigned: 0,
            });

        } catch (err) {
            console.error("Messenger load failed:", err);
            setMessengers([]);
            setMessengerTotal(0);
        } finally {
            setMessengerLoading(false);
        }
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
        await loadGuestNetwork();
        guestTable.setPage(1);
    }

    /* ================= ADD MESSENGER HANDLER (with Zod) ================= */
    async function handleAddMessenger() {
        setFormErrors({});

        try {
            const parsed = messengerSchema.parse(messengerForm);

            await createMessenger({
                messenger_name: parsed.messenger_name,
                messenger_name_local_language:
                    parsed.messenger_name_local_language || undefined,
                primary_mobile: parsed.primary_mobile,
                secondary_mobile: parsed.secondary_mobile || undefined,
                email: parsed.email || undefined,
                designation: parsed.designation || undefined,
                remarks: parsed.remarks || undefined,
            });

            setShowAddMessenger(false);
            setMessengerForm({
                messenger_name: "",
                messenger_name_local_language: "",
                primary_mobile: "",
                secondary_mobile: "",
                email: "",
                designation: "",
                remarks: "",
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
    }, [
        guestTable.query.page,
        guestTable.query.limit,
        guestTable.query.search,
        guestTable.query.sortBy,
        guestTable.query.sortOrder,
    ]);

    useEffect(() => {
        loadNetworks();
    }, [
        networkTable.query.page,
        networkTable.query.limit,
        networkTable.query.search,
        networkTable.query.sortBy,
        networkTable.query.sortOrder,
        networkTable.query.status,
        networkTable.query.networkType,
    ]);

    useEffect(() => {
        loadMessengers();
    }, [
        messengerTable.query.page,
        messengerTable.query.limit,
        messengerTable.query.search,
        messengerTable.query.status,
        messengerTable.query.sortBy,
        messengerTable.query.sortOrder,
    ]);

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
            render: (row) => row.room_no || "—",
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

                if (row.network_status === "Connected") {
                    return (
                        <span className={`${base} bg-green-100 text-green-800`}>
                            Network Connected
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

            {/* ================= TABS ================= */}
            <div className="nicTabs">
                <button
                    className={`nicTab ${activeTab === "guestMng" ? "active" : ""}`}
                    onClick={() => { setActiveTab("guestMng"); }}
                >
                    Guest Network
                </button>

                <button
                    className={`nicTab ${activeTab === "networks" ? "active" : ""}`}
                    onClick={() => {
                        setActiveTab("networks");
                        setDeleteError(null);
                        networkTable.setPage(1);
                        networkTable.setStatus("all");
                    }}
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


            {/* ================= STATS SECTION ================= */}
            {activeTab === "guestMng" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Guests"
                        value={guestStats.total}
                        icon={Users}
                        variant="blue"
                    // active={activeCard === "TOTAL"}
                    // onClick={() => applyCardView("TOTAL")}
                    />
                    <StatCard
                        title="Requested"
                        value={guestStats.requested}
                        icon={Wifi}
                        variant="orange"
                    // active={activeCard === "REQUESTED"}
                    // onClick={() => applyCardView("REQUESTED")}
                    />
                    <StatCard
                        title="Connected"
                        value={guestStats.connected}
                        icon={CheckCircle}
                        variant="green"
                    // active={activeCard === "CONNECTED"}
                    // onClick={() => applyCardView("CONNECTED")}
                    />
                    <StatCard
                        title="Issue Reported"
                        value={guestStats.issueReported}
                        icon={ShieldAlert}
                        variant="red"
                    // active={activeCard === "ISSUE_REPORTED"}
                    // onClick={() => applyCardView("ISSUE_REPORTED")}
                    />
                </div>
            )}

            {deleteError && activeTab === "networks" && (
                <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {deleteError}
                </div>
            )}

            {activeTab === "networks" && (
                // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                //     <StatCard
                //         title="Total Providers"
                //         value={networkStats.total}
                //         icon={Router}
                //         variant="blue"
                //     />
                //     <StatCard
                //         title="Wi-Fi"
                //         value={networkStats.wifi}
                //         icon={Wifi}
                //         variant="green"
                //     />
                //     <StatCard
                //         title="Broadband"
                //         value={networkStats.broadband}
                //         icon={Router}
                //         variant="orange"
                //     />
                //     <StatCard
                //         title="Leased Line"
                //         value={networkStats.leasedLine}
                //         icon={Router}
                //         variant="purple"
                //     />
                // </div>
                <div className="statsGrid">
                    {/* STATUS CARDS */}
                    <StatCard
                        title="Total Providers"
                        value={networkStats.total}
                        icon={Router}
                        variant="blue"
                        active={!networkTable.query.status || networkTable.query.status === "all"}
                        onClick={() => applyNetworkStatus("all")}
                    />

                    <StatCard
                        title="Active"
                        value={networkStats.active}
                        icon={CheckCircle}
                        variant="green"
                        active={networkTable.query.status === "active"}
                        onClick={() => applyNetworkStatus("active")}
                    />

                    <StatCard
                        title="Inactive"
                        value={networkStats.inactive}
                        icon={XCircle}
                        variant="red"
                        active={networkTable.query.status === "inactive"}
                        onClick={() => applyNetworkStatus("inactive")}
                    />

                    {/* TYPE CARDS (informational) */}
                    <StatCard
                        title="Wi-Fi"
                        value={networkStats.wifi}
                        icon={Wifi}
                        variant="green"
                        active={networkTable.query.networkType === "WiFi"}
                        onClick={() => applyNetworkType("WiFi")}
                    />

                    <StatCard
                        title="Broadband"
                        value={networkStats.broadband}
                        icon={Router}
                        variant="orange"
                        active={networkTable.query.networkType === "Broadband"}
                        onClick={() => applyNetworkType("Broadband")}
                    />

                    <StatCard
                        title="Leased Line"
                        value={networkStats.leasedLine}
                        icon={Router}
                        variant="purple"
                        active={networkTable.query.networkType === "Leased-Line"}
                        onClick={() => applyNetworkType("Leased-Line")}
                    />
                </div>
            )}

            {activeTab === "messengers" && (
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <StatCard
                        title="Total Messengers"
                        value={messengerStats.total}
                        icon={Users}
                        variant="blue"
                        active={!messengerTable.query.status}
                        onClick={() => {
                            messengerTable.setPage(1);
                            messengerTable.setStatus(undefined);
                        }}
                    />

                    <StatCard
                        title="Active"
                        value={messengerStats.active}
                        icon={CheckCircle}
                        variant="green"
                        active={messengerTable.query.status === "active"}
                        onClick={() => applyMessengerStatus("active")}
                    />

                    <StatCard
                        title="Assigned"
                        value={messengerStats.assigned}
                        icon={Smartphone}
                        variant="blue"
                        active={messengerTable.query.status === "assigned"}
                        onClick={() => applyMessengerStatus("assigned")}
                    />

                    <StatCard
                        title="Unassigned"
                        value={messengerStats.unassigned}
                        icon={User}
                        variant="orange"
                        active={messengerTable.query.status === "unassigned"}
                        onClick={() => applyMessengerStatus("unassigned")}
                    />

                    <StatCard
                        title="Inactive"
                        value={messengerStats.inactive}
                        icon={XCircle}
                        variant="red"
                        active={messengerTable.query.status === "inactive"}
                        onClick={() => applyMessengerStatus("inactive")}
                    />
                    {/* <StatCard
                        title="Total Messengers"
                        value={messengerStats.total}
                        icon={Users}
                        variant="blue"
                    />
                    <StatCard
                        title="Assigned"
                        value={messengerStats.assigned}
                        icon={Smartphone}
                        variant="green"
                    />
                    <StatCard
                        title="Unassigned"
                        value={messengerStats.unassigned}
                        icon={User}
                        variant="orange"
                    />
                    <StatCard
                        title="Inactive"
                        value={messengerStats.inactive}
                        icon={XCircle}
                        variant="red"
                    /> */}
                </div>
            )}


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
                                    resetNetworkForm();
                                    setIsAddNetwork(true);
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
                            <button className="closeBtn" 
                            onClick={() => {
                                setAssignModal(false);
                                setAssignTouched(false);
                            }}>✕</button>
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
                                        {messengers?.map((m) => (
                                            <option key={m.messenger_id} value={m.messenger_id}>
                                                {m.messenger_name}
                                            </option>
                                        ))}
                                    </select>
                                    {assignTouched && !assignForm.assigned_to && (
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
                            <button className="cancelBtn" 
                            onClick={() => {
                                setAssignModal(false);
                                setAssignTouched(false);
                            }}>
                                Cancel
                            </button>
                            <button
                                className="saveBtn"
                                onClick={() => {
                                    setAssignTouched(true);
                                    handleAssignMessenger();
                                }}
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

                                <div>
                                    <label className="nicLabel">Name (Local Language)</label>
                                    <input
                                        className="nicInput"
                                        value={messengerForm.messenger_name_local_language}
                                        onChange={(e) =>
                                            setMessengerForm({
                                                ...messengerForm,
                                                messenger_name_local_language: e.target.value,
                                            })
                                        }
                                        maxLength={100}
                                    />
                                </div>

                                <div>
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
                                </div>

                                <div>
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
                                </div>

                                <div>
                                    <label className="nicLabel">Remarks</label>
                                    <textarea
                                        className="nicInput"
                                        rows={3}
                                        value={messengerForm.remarks}
                                        maxLength={500}
                                        onChange={(e) =>
                                            setMessengerForm({
                                                ...messengerForm,
                                                remarks: e.target.value,
                                            })
                                        }
                                    />
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
                        <div className="nicModalBody">

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
                                        onBlur={() => validateField(networkProviderSchema, "provider_name", networkForm.provider_name, setFormErrors)}
                                    />
                                    <FieldError message={formErrors.provider_name} />
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
                                        onBlur={() => validateField(networkProviderSchema, "bandwidth_mbps", networkForm.bandwidth_mbps, setFormErrors)}
                                    />
                                    <FieldError message={formErrors.bandwidth_mbps} />
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
                                        onBlur={() => validateField(networkProviderSchema, "password", networkForm.password, setFormErrors)}
                                    />
                                    <FieldError message={formErrors.password} />
                                </div>

                                <div>
                                    <label className="nicLabel">Static IP</label>
                                    <input
                                        className="nicInput"
                                        value={networkForm.static_ip}
                                        onChange={(e) =>
                                            setNetworkForm({ ...networkForm, static_ip: e.target.value })
                                        }
                                        onBlur={() => validateField(networkProviderSchema, "static_ip", networkForm.static_ip, setFormErrors)}
                                    />
                                    <FieldError message={formErrors.static_ip} />
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
                        </div>

                        <div className="nicModalActions">
                            <button
                                className="cancelBtn"
                                onClick={() => {
                                    setNetworkModalOpen(false);
                                    resetNetworkForm();
                                }}
                            >
                                Cancel
                            </button>

                            {/* SAVE */}
                            <button
                                className="saveBtn"
                                onClick={async () => {
                                    setFormErrors({});

                                    try {
                                        const parsed = networkProviderSchema.parse({
                                            ...networkForm,
                                            bandwidth_mbps: networkForm.bandwidth_mbps
                                                ? Number(networkForm.bandwidth_mbps)
                                                : undefined,
                                        });

                                        const payload = { ...parsed };

                                        // Remove empty password for edit
                                        if (!payload.password) {
                                            delete payload.password;
                                        }

                                        if (editNetwork?.provider_id) {
                                            await updateNetwork(editNetwork.provider_id, payload);
                                        } else {
                                            await createNetwork(payload);
                                        }

                                        // Reset form
                                        resetNetworkForm();
                                        setNetworkModalOpen(false);

                                        await loadNetworks();
                                        networkTable.setPage(1);

                                    } catch (err: any) {
                                        if (err instanceof ZodError) {
                                            const errors: Record<string, string> = {};
                                            err.issues.forEach((issue: any) => {
                                                errors[issue.path[0] as string] = issue.message;
                                            });
                                            setFormErrors(errors);
                                        } else {
                                            console.error(err);
                                        }
                                    }
                                }}
                            >
                                Save
                            </button>
                            {/* <button
                                className="saveBtn"
                                onClick={async () => {
                                    setFormErrors({});
                                    try {
                                        const parsed = networkProviderSchema.parse(networkForm);

                                        if (editNetwork?.provider_id) {
                                            await updateNetwork(editNetwork.provider_id, parsed);
                                        } else {
                                            await createNetwork(parsed);
                                        }

                                        setNetworkModalOpen(false);
                                        setEditNetwork(null);
                                        await loadNetworks();
                                        networkTable.setPage(1);
                                    } catch (err: any) {
                                        if (err instanceof ZodError) {
                                            const errors: Record<string, string> = {};
                                            err.issues.forEach((issue: any) => {
                                                errors[issue.path[0] as string] = issue.message;
                                            });
                                            setFormErrors(errors);
                                        } else {
                                            console.error(err);
                                        }
                                    }
                                }}
                            >
                                Save
                            </button> */}

                            {/* SAVE & ADD NEW */}
                            {!editNetwork?.provider_id && (
                                <button
                                    className="saveBtn"
                                    onClick={async () => {
                                        setFormErrors({});
                                        try {
                                            const parsed = networkProviderSchema.parse(networkForm);

                                            await createNetwork(parsed);

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
                                        } catch (err: any) {
                                            if (err instanceof ZodError) {
                                                const errors: Record<string, string> = {};
                                                err.issues.forEach((issue: any) => {
                                                    errors[issue.path[0] as string] = issue.message;
                                                });
                                                setFormErrors(errors);
                                            } else {
                                                console.error(err);
                                            }
                                        }
                                        setEditNetwork(null);
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
                                    onBlur={() => validateField(messengerSchema, "messenger_name", messengerEditForm.messenger_name, setFormErrors)}
                                />
                                <FieldError message={formErrors.messenger_name} />
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
                                    onBlur={() => validateField(messengerSchema, "primary_mobile", messengerEditForm.primary_mobile, setFormErrors)}
                                />
                                <FieldError message={formErrors.primary_mobile} />
                            </div>

                            <div>
                                <label className="nicLabel">Email <span className="required">*</span></label>
                                <input
                                    className="nicInput"
                                    value={messengerEditForm.email}
                                    onChange={(e) =>
                                        setMessengerEditForm({
                                            ...messengerEditForm,
                                            email: e.target.value,
                                        })
                                    }
                                    onBlur={() => validateField(messengerSchema, "email", messengerEditForm.email, setFormErrors)}
                                />
                                <FieldError message={formErrors.email} />
                            </div>

                            <div>
                                <label className="nicLabel">Name (Local Language)</label>
                                <input
                                    className="nicInput"
                                    value={messengerEditForm.messenger_name_local_language}
                                    onChange={(e) =>
                                        setMessengerEditForm({
                                            ...messengerEditForm,
                                            messenger_name_local_language: e.target.value,
                                        })
                                    }
                                    maxLength={100}
                                />
                            </div>

                            <div>
                                <label className="nicLabel">Secondary Mobile</label>
                                <input
                                    className="nicInput"
                                    value={messengerEditForm.secondary_mobile}
                                    maxLength={10}
                                    onChange={(e) =>
                                        setMessengerEditForm({
                                            ...messengerEditForm,
                                            secondary_mobile: e.target.value.replace(/\D/g, ""),
                                        })
                                    }
                                    onBlur={() => validateField(messengerSchema, "secondary_mobile", messengerEditForm.secondary_mobile, setFormErrors)}
                                />
                                <FieldError message={formErrors.secondary_mobile} />
                            </div>

                            <div>
                                <label className="nicLabel">Designation</label>
                                <input
                                    className="nicInput"
                                    value={messengerEditForm.designation}
                                    maxLength={50}
                                    onChange={(e) =>
                                        setMessengerEditForm({
                                            ...messengerEditForm,
                                            designation: e.target.value,
                                        })
                                    }
                                    onBlur={() => validateField(messengerSchema, "designation", messengerEditForm.designation, setFormErrors)}
                                />
                                <FieldError message={formErrors.designation} />
                            </div>

                            <div>
                                <label className="nicLabel">Remarks</label>
                                <textarea
                                    className="nicInput"
                                    rows={3}
                                    value={messengerEditForm.remarks}
                                    maxLength={500}
                                    onChange={(e) =>
                                        setMessengerEditForm({
                                            ...messengerEditForm,
                                            remarks: e.target.value,
                                        })
                                    }
                                    onBlur={() => validateField(messengerSchema, "remarks", messengerEditForm.remarks, setFormErrors)}
                                />
                                <FieldError message={formErrors.remarks} />
                            </div>
                        </div>

                        <div className="nicModalActions">
                            <button className="cancelBtn" onClick={() => setEditMessenger(null)}>
                                Cancel
                            </button>
                            <button
                                className="saveBtn"
                                onClick={async () => {
                                    await updateMessenger(editMessenger.messenger_id, {
                                        ...messengerEditForm,
                                        messenger_name_local_language:
                                            messengerEditForm.messenger_name_local_language || undefined,
                                        secondary_mobile:
                                            messengerEditForm.secondary_mobile || undefined,
                                        email: messengerEditForm.email || undefined,
                                        designation: messengerEditForm.designation || undefined,
                                        remarks: messengerEditForm.remarks || undefined,
                                    });
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
                            <h2>Assign Network</h2>
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
                            <label>Username *</label>
                            <select
                                value={guestForm.provider_id}
                                onChange={(e) =>
                                setGuestForm({ ...guestForm, provider_id: e.target.value })
                                }
                            >
                                <option value="">Select Username</option>
                                {activeProviders
                                .filter(p => p.username)
                                .map(p => (
                                    <option key={p.provider_id} value={p.provider_id}>
                                        {p.username} ({p.provider_name})
                                    </option>
                                ))}
                            </select>
                            </div>

                            <div>
                            <label>Remarks</label>
                            <textarea
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
                                        alert('Please select username');
                                        return;
                                    }

                                    try {
                                        await createGuestNetwork({
                                            guest_id: editGuest.guest_id,
                                            provider_id: guestForm.provider_id,
                                            remarks: guestForm.remarks || undefined,
                                        });

                                        await loadGuestNetwork();
                                        setEditGuest(null);
                                        setGuestForm({
                                            provider_id: "",
                                            remarks: "",
                                        });

                                    } catch (err: any) {
                                        const message =
                                            err?.response?.data?.message ||
                                            "Unable to assign network";
                                        alert(message);
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
