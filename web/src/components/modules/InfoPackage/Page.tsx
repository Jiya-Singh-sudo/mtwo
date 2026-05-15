import { useEffect, useState } from "react";
import { FileText, Download, X, Eye } from "lucide-react";
import { formatDateTime } from "@/utils/dateTime";
import {
  getInfoPackageGuests,
  downloadInfoPackagePdf,
  sendInfoPackageWhatsapp,
} from "@/api/info-package.api";

import { DataTable, Column } from "@/components/ui/DataTable";
import GlobalTableFilters from "@/components/common/GlobalTableFilters";
import { useError } from "@/context/ErrorContext";

export default function InfoPackage() {
  const { showError, showSuccess } = useError();
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
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* ================= FILTER STATE ================= */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");



  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadGuests();
  }, [page, limit, sortBy, sortOrder, debouncedSearch, fromDate, toDate]);

  useEffect(() => { 
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset pagination on search
    }, 400);

    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);
  async function loadGuests() {
    setLoading(true);
    try {
      const res = await getInfoPackageGuests({
        page,
        limit,
        search: debouncedSearch,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      setGuests(Array.isArray(res?.data) ? res.data : []);
      setTotalCount(typeof res?.total === 'number' ? res.total : 0);
    } catch (err: any) {
      console.error('Failed to load guests', err);
      showError(err?.response?.data?.message || 'Failed to load guests');
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
    try {
      const blob = await downloadInfoPackagePdf(activeGuest.guest_id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Guest_Info_${activeGuest.guest_id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      setShowPdfModal(false);
      showSuccess("PDF generated successfully");
    } catch (err: any) {
      console.error("Failed to generate PDF", err);
      showError(err?.response?.data?.message || "Failed to generate PDF");
    }
  }

  // function handleSendWhatsApp(guest: any) {
  //   setActiveGuest(guest);
  //   setShowWhatsAppModal(true);
  // }

  async function confirmSendWhatsApp() {
    try {
      await sendInfoPackageWhatsapp(activeGuest.guest_id);
      setShowWhatsAppModal(false);
      showSuccess("Info package sent successfully via WhatsApp");
    } catch (err: any) {
      console.error("Failed to send WhatsApp", err);
      showError(err?.response?.data?.message || "Failed to send WhatsApp");
    }
  }

  /* ================= TABLE COLUMNS ================= */
  const columns: Column<any>[] = [
    {
      header: "Name",
      render: (g: any) => (
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
      render: (g: any) => formatDateTime(g.arrival_date),
    },
    {
      header: "Departure",
      accessor: "departure_date",
      sortable: true,
      sortKey: "departure_date",
      render: (g: any) => formatDateTime(g.departure_date),
    },
    {
      header: "Actions",
      render: (g: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedGuest(g);
              setIsViewOpen(true);
            }}
            className="icon-btn text-blue-600"
            title="View Guest"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleGeneratePDF(g)}
            className="icon-btn text-green-600"
            title="Generate PDF"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* <button
            onClick={() => handleSendWhatsApp(g)}
            className="icon-btn text-green-600"
          >
            <Send className="w-4 h-4" />
          </button> */}

          <button
            onClick={() => handleGeneratePDF(g)}
            className="icon-btn"
            title="Download PDF"
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

      {/* ===== GENERATE CUSTOM REPORT ===== */}
      <div className="bg-white">
        <GlobalTableFilters
          search={search}
          setSearch={setSearch}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          onReset={() => {
            setSearch("");
            setFromDate("");
            setToDate("");
          }}
          variant="toolbar"
          className="infoFilters"
        />
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
          onSortChange={(s: string, o: "asc" | "desc") => {
            setSortBy(s);
            setSortOrder(o);
          }}
        />
        {!loading && guests.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No guests found for selected filters
          </div>
        )}
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

      {/* VIEW GUEST MODAL */}
      {isViewOpen && selectedGuest && (
        <div className="modalOverlay">
          <div className="nicModal guestDetailsModal">

            {/* HEADER */}
            <div className="nicModalHeader">
              <h2>Guest Details</h2>

              <button onClick={() => setIsViewOpen(false)}>
                <X />
              </button>
            </div>

            {/* BODY */}
            {/* BODY */}
            <div className="nicModalBody">
              <div className="detailGridHorizontal">

                {/* GUEST INFO */}
                <div className="detailSection">
                  <h4>Guest Information</h4>

                  <p>
                    <b>Name:</b><br />
                    {selectedGuest?.guest_name || "-"}
                  </p>

                  <p>
                    <b>Designation:</b><br />
                    {selectedGuest?.designation_name || "-"}
                  </p>

                  <p>
                    <b>Department:</b><br />
                    {selectedGuest?.department || "-"}
                  </p>

                  <p>
                    <b>Category:</b><br />
                    {selectedGuest?.guest_category || "-"}
                  </p>
                </div>

                {/* STAY INFO */}
                <div className="detailSection">
                  <h4>Stay Information</h4>

                  <p>
                    <b>Room No:</b><br />
                    {selectedGuest?.room_no || "Pending"}
                  </p>

                  <p>
                    <b>Vehicle No:</b><br />
                    {selectedGuest?.vehicle_no || "Pending"}
                  </p>

                  <p>
                    <b>Arrival:</b><br />
                    {selectedGuest?.arrival_date || "-"}
                  </p>

                  <p>
                    <b>Departure:</b><br />
                    {selectedGuest?.departure_date || "-"}
                  </p>
                </div>

                {/* CONTACT INFO */}
                <div className="detailSection">
                  <h4>Contact Information</h4>

                  <p>
                    <b>Mobile:</b><br />
                    {selectedGuest?.mobile_no || "-"}
                  </p>

                  <p>
                    <b>Email:</b><br />
                    {selectedGuest?.email || "N/A"}
                  </p>

                  <p>
                    <b>ID Proof:</b><br />
                    {selectedGuest?.id_proof || "-"}
                  </p>

                  <p>
                    <b>ID Number:</b><br />
                    {selectedGuest?.id_number || "-"}
                  </p>
                </div>

              </div>
            </div>

            {/* FOOTER */}
            <div className="nicModalActions">
              <button
                className="outlineBtn"
                onClick={() => setIsViewOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}