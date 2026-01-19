import { useEffect, useState } from "react";
import { FileText, Download, Send, User, BedDouble, Car, Calendar, X,} from "lucide-react";
import { formatDateTime } from "@/utils/dateTime";
import {
  getInfoPackageGuests,
  downloadInfoPackagePdf,
  sendInfoPackageWhatsapp,
} from "@/api/info-package.api";

import { DataTable, Column } from "@/components/ui/DataTable";

export default function InfoPackage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [activeGuest, setActiveGuest] = useState<any>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [sortBy, setSortBy] = useState("arrival_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");


  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadGuests();
  }, [page, limit, sortBy, sortOrder, debouncedSearch]);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset pagination on search
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  async function loadGuests() {
    setLoading(true);
    try {
      const res = await getInfoPackageGuests({
        page,
        limit,
        search: debouncedSearch,
      });

    setGuests(Array.isArray(res?.data) ? res.data : []);
    setTotalCount(typeof res?.total === 'number' ? res.total : 0);
    // console.log('InfoPackage API response:', res);
    // console.log('Guests state:', res?.data);
    // console.log('Guests state:', res?.total);

    } finally {
      setLoading(false);
    }
  }

  /* ================= ACTIONS ================= */
  function handleGeneratePDF(guest: any) {
    setActiveGuest(guest);
    setShowPdfModal(true);
  }

  async function confirmGeneratePDF() {
    const blob = await downloadInfoPackagePdf(activeGuest.guest_id);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Guest_Info_${activeGuest.guest_id}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);

    setShowPdfModal(false);
  }

  function handleSendWhatsApp(guest: any) {
    setActiveGuest(guest);
    setShowWhatsAppModal(true);
  }

  async function confirmSendWhatsApp() {
    await sendInfoPackageWhatsapp(activeGuest.guest_id);
    setShowWhatsAppModal(false);
  }

  /* ================= TABLE COLUMNS ================= */
  const columns: Column<any>[] = [
    {
      header: "Name",
      render: (g) => (
        <>
          <div className="font-medium">{g.guest_name}</div>
          <p className="text-sm text-gray-600">{g.designation_name}</p>
        </>
      ),
    },
    {
      header: "Room",
      accessor: "room_no",
      emptyFallback: "Pending",
    },
    {
      header: "Vehicle",
      accessor: "vehicle_no",
      emptyFallback: "Pending",
    },
    {
      header: "Arrival",
      accessor: "arrival_date",
      sortable: true,
      sortKey: "arrival_date",
      render: (g) => formatDateTime(g.arrival_date),
    },
    {
      header: "Departure",
      accessor: "departure_date",
      sortable: true,
      sortKey: "departure_date",
      render: (g) => formatDateTime(g.departure_date),
    },
    {
      header: "Actions",
      render: (g) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleGeneratePDF(g)}
            className="icon-btn text-blue-600"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSendWhatsApp(g)}
            className="icon-btn text-green-600"
          >
            <Send className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleGeneratePDF(g)}
            className="icon-btn"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      <h2 className="text-[#00247D]">Guest Info Package Generator</h2>
      <div className="bg-white border rounded-sm p-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by guest name, room or vehicle"
          value={search}
          maxLength={50}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 px-3 border rounded-sm focus:outline-none focus:ring-2 focus:ring-[#00247D]"
        />

        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-gray-500 hover:text-black"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* ===== CARD VIEW (UNCHANGED UI) ===== */}
      <div className="bg-white border rounded-sm p-6 space-y-4">
        {Array.isArray(guests) && guests.map((guest) => (
          <div
            key={guest.guest_id}
            className="border rounded-sm p-6"
          >
            <div className="flex justify-between mb-4">
              <div>
                <h4>{guest.guest_name}</h4>
                <p className="text-sm text-gray-600">{guest.designation_name}</p>
              </div>

              <span className="guestBadge vip">
                {guest.designation_name}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4" /> {guest.room_no || "Pending"}
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" /> {guest.vehicle_no || "Pending"}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Arrival: {formatDateTime(guest.arrival_date)}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Departure: {formatDateTime(guest.departure_date)}
              </div>
              {guest.driver_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Driver: {guest.driver_name}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleGeneratePDF(guest)}
                className="flex-1 bg-[#00247D] text-white py-2 rounded-sm"
              >
                Generate PDF Package
              </button>

              <button
                onClick={() => handleSendWhatsApp(guest)}
                className="flex-1 bg-green-600 text-white py-2 rounded-sm"
              >
                Send via WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ===== DATA TABLE (ALL GUESTS) ===== */}
      <div className="bg-white border rounded-sm">
        <DataTable
          data={guests}
          columns={columns}
          keyField="guest_id"
          page={page}
          limit={limit}
          totalCount={totalCount}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={loading}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onSortChange={(s, o) => {
            setSortBy(s);
            setSortOrder(o);
          }}
        />
      </div>

      {/* ===== MODALS ===== */}
      {showPdfModal && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h3>Generate PDF</h3>
              <button onClick={() => setShowPdfModal(false)}><X /></button>
            </div>
            <p>Generate PDF for <b>{activeGuest?.guest_name}</b>?</p>
            <button className="saveBtn" onClick={confirmGeneratePDF}>
              Generate
            </button>
          </div>
        </div>
      )}

      {showWhatsAppModal && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h3>Send via WhatsApp</h3>
              <button onClick={() => setShowWhatsAppModal(false)}><X /></button>
            </div>
            <p>Send info package to <b>{activeGuest?.guest_name}</b>?</p>
            <button className="saveBtn" onClick={confirmSendWhatsApp}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}