'use client';
import { useEffect, useState } from "react";
import { Plus, Eye, Edit, User, ClipboardList, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./NetworkManagement.css";
import { getNetworkTable, softDeleteNetwork } from "@/api/network.api";
import { getMessengerTable, softDeleteMessenger } from "@/api/messenger.api";
import { unassignGuestMessenger, createGuestMessenger, getGuestNetworkTable } from "@/api/guestMessenger.api";
import { closeGuestNetwork } from "@/api/guestNetwork.api";
import { NetworkProvider } from "@/types/network";
import { Messenger } from "@/types/messenger";
import { useTableQuery } from "@/hooks/useTableQuery";
import { DataTable } from "@/components/ui/DataTable";
import type { Column } from "@/components/ui/DataTable";

// GuestNetwork type removed - using GuestNetworkView locally

type AssignMessengerForm = {
    assigned_to: string;
    admin_remark: string;
};

type GuestNetworkView = {
    guest_id: string;
    guest_name: string;

    room_id: string | null;

    guest_network_id: string | null;
    network_name: string | null;
    network_status: string | null;

    guest_messenger_id: string | null;
    messenger_name: string | null;
    messenger_status: string | null;
};


export default function NetworkManagement() {

    const [activeTab, setActiveTab] =
        useState<"guestMng" | "networks" | "messengers">("guestMng");
    // const {
    //     query,
    //     setPage,
    //     setLimit,
    //     setSort,
    // } = useTableQuery({
    //     sortBy: "guest_name",
    //     sortOrder: "asc",
    // });

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


    /* ================= GUEST NETWORK ================= */
    const [networks, setNetworks] = useState<NetworkProvider[]>([]);
    const [guestRows, setGuestRows] = useState<GuestNetworkView[]>([]);
    const [assignModal, setAssignModal] = useState(false);
    const [selectedGuest, setSelectedGuest] =
        useState<GuestNetworkView | null>(null);

    const [assignForm, setAssignForm] = useState<AssignMessengerForm>({
        assigned_to: "",
        admin_remark: "",
    });


    /* ================= MESSENGERS ================= */
    const [messengers, setMessengers] = useState<Messenger[]>([]);
    const [_showAddMessenger, setShowAddMessenger] = useState(false);
    const [guestTotal, setGuestTotal] = useState(0);
    const [guestLoading, setGuestLoading] = useState(false);

    const [networkTotal, setNetworkTotal] = useState(0);
    const [networkLoading, setNetworkLoading] = useState(false);

    const [messengerTotal, setMessengerTotal] = useState(0);
    const [messengerLoading, setMessengerLoading] = useState(false);


    async function loadGuestNetwork() {
        setGuestLoading(true);

        const res = await getGuestNetworkTable({
            page: guestTable.query.page,
            limit: guestTable.query.limit,
            sortBy: [
                "guest_name",
                "network_name",
                "network_status",
            ].includes(guestTable.query.sortBy)
                ? guestTable.query.sortBy
                : "guest_name" as any,
            sortOrder: guestTable.query.sortOrder,

            // 🔥 THIS IS THE MISSING PIECE
            // status: "All",
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

    const guestNetworkColumns: Column<GuestNetworkView>[] = [
        {
            header: "Guest",
            accessor: "guest_name",
            sortable: true,
            sortKey: "guest_name",
        },
        {
            header: "Room",
            accessor: "room_id",
        },
        {
            header: "Provider",
            accessor: "network_name",
        },
        {
            header: "Status",
            accessor: "network_status",
        },
        {
            header: "Actions",
            render: (row) => (
                <div className="flex gap-3">
                    <Eye
                        size={16}
                        className="cursor-pointer"
                        onClick={() => console.log("View history:", row.guest_network_id)}
                    />

                    <ClipboardList
                        size={16}
                        className="cursor-pointer"
                        onClick={async () => {
                            if (!row.guest_network_id) return;

                            await closeGuestNetwork(row.guest_network_id, {
                                end_date: new Date().toISOString().slice(0, 10),
                                end_time: new Date().toTimeString().slice(0, 5),
                                end_status: "Completed",
                                network_status: "Closed",
                                remarks: "Closed by admin",
                            });

                            loadGuestNetwork();
                        }}
                    />

                    <User
                        size={16}
                        className="cursor-pointer"
                        onClick={() => {
                            setSelectedGuest(row);
                            setAssignModal(true);
                        }}
                    />

                    {row.guest_messenger_id && (
                        <X
                            size={16}
                            className="cursor-pointer"
                            onClick={async () => {
                                await unassignGuestMessenger(row.guest_messenger_id!);
                                loadGuestNetwork();
                            }}
                        />
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
        },
        {
            header: "Actions",
            render: (row) => (
                <div className="flex gap-3">
                    <Eye size={16} />
                    <Edit size={16} onClick={() => console.log("Edit", row.provider_id)} />
                    <X
                        size={16}
                        onClick={async () => {
                            await softDeleteNetwork(row.provider_id);
                            loadNetworks();
                        }}
                    />
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
        },
        {
            header: "Designation",
            accessor: "designation",
        },
        {
            header: "Actions",
            render: (row) => (
                <div className="flex gap-3">
                    <Eye size={16} />
                    <Edit size={16} onClick={() => console.log("Edit", row.messenger_id)} />
                    <X
                        size={16}
                        onClick={async () => {
                            await softDeleteMessenger(row.messenger_id);
                            loadMessengers();
                        }}
                    />
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
                    onClick={() => setActiveTab("guestMng")}
                >
                    Guest Network
                </button>

                <button
                    className={`nicTab ${activeTab === "networks" ? "active" : ""}`}
                    onClick={() => setActiveTab("networks")}
                >
                    Networks
                </button>

                <button
                    className={`nicTab ${activeTab === "messengers" ? "active" : ""}`}
                    onClick={() => setActiveTab("messengers")}
                >
                    Messengers
                </button>
            </div>


            {/* ================= TAB 1: GUEST NETWORK ================= */}
            {activeTab === "guestMng" && (
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
            )}

            {/* ================= TAB 2: NETWORKS ================= */}
            {activeTab === "networks" && (
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
            )}

            {/* ================= TAB 3: MESSENGERS ================= */}
            {activeTab === "messengers" && (
                <>
                    <div className="flex justify-between">
                        <input className="nicInput" placeholder="Search messenger..." />
                        <Button onClick={() => setShowAddMessenger(true)}>
                            <Plus /> Add Messenger
                        </Button>
                    </div>

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

            {/* ================= ASSIGN MESSENGER MODAL ================= */}
            {assignModal && selectedGuest && (
                <div className="modalOverlay">
                    <div className="nicModal">
                        <h3>Assign Messenger</h3>

                        <textarea
                            placeholder="Admin Remark"
                            className="nicInput"
                            onChange={e =>
                                setAssignForm({
                                    ...assignForm,
                                    admin_remark: e.target.value,
                                })
                            }
                        />

                        <select
                            className="nicInput"
                            onChange={e =>
                                setAssignForm({
                                    ...assignForm,
                                    assigned_to: e.target.value,
                                })
                            }
                        >
                            <option value="">Select Messenger</option>
                            {messengers.map(m => (
                                <option key={m.messenger_id} value={m.messenger_id}>
                                    {m.messenger_name}
                                </option>
                            ))}
                        </select>

                        <div className="nicModalActions">
                            <button onClick={() => setAssignModal(false)}>Cancel</button>
                            <button
                                onClick={async () => {
                                    if (!selectedGuest || !assignForm.assigned_to) return;

                                    await createGuestMessenger({
                                        guest_id: selectedGuest.guest_id,
                                        messenger_id: assignForm.assigned_to,
                                        assignment_date: new Date().toISOString().slice(0, 10),
                                        remarks: assignForm.admin_remark,
                                    });

                                    setAssignModal(false);
                                    setAssignForm({ assigned_to: "", admin_remark: "" });
                                    await loadGuestNetwork();
                                }}
                            >
                                Assign
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
