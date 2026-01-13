import { useEffect, useState } from "react";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { getActiveGuests, createGuest, updateGuest, softDeleteGuest, fetchGuestStatusCounts } from "@/api/guest.api";
import { createGuestDesignation, updateGuestDesignation } from "@/api/guestDesignation.api";
import { updateGuestInOut, softDeleteGuestInOut } from "@/api/guestInOut.api";
import { guestManagementSchema } from "@/validation/guestManagement.validation";
// import { designationSchema } from "@/validation/designation.validation";
// import { guestInOutSchema } from "@/validation/guestInOut.validation";
import { useTableQuery } from "@/hooks/useTableQuery";
import { ZodError } from "zod";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { ActiveGuestRow } from "../../../types/guests";
import "./GuestManagementModals.css";
import { getActiveDesignationList } from "@/api/designation.api";
import { formatSeparate, formatTime, formatDate } from "@/utils/dateTime";
import TimePicker12h from "@/components/common/TimePicker12h";
import { GUEST_STATUS_CARDS, COLOR_STYLES, GUEST_STATUSES } from "@/utils/guestCards";

type DesignationOption = {
  designation_id: string;
  designation_name: string;
  organization?: string;
  office_location?: string;
  department?: string;
};

type GuestForm = {
  guest_name: string;
  guest_name_local_language: string;
  guest_mobile: string;
  guest_alternate_mobile: string;
  guest_address: string;
  email: string;
  designation_id: string;
  designation_name: string;
  department: string;
  organization: string;
  office_location: string;
  entry_date: string;
  entry_time: string;
  exit_date: string;
  exit_time: string;
  status: string;
};

export function GuestManagement() {
  const today = new Date();
  const currentYear = today.getFullYear();

  const minDate = `${currentYear}-01-01`;
  const maxDate = `${currentYear + 1}-12-31`; // adjust if needed

  const [guests, setGuests] = useState<ActiveGuestRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showView, setShowView] = useState(false);
  type ModalMode = "add" | "edit" | null;
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedGuest, setSelectedGuest] = useState<ActiveGuestRow | null>(null);
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [designationMode, setDesignationMode] = useState<"existing" | "other">("existing");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const refreshStatusCounts = async () => {
    const counts = await fetchGuestStatusCounts();
    setStatusCounts(counts);
  };
  
  const initialGuestForm = {
    guest_name: '',
    guest_name_local_language: '',
    guest_mobile: '',
    guest_alternate_mobile: '',
    guest_address: '',
    email: '',
    // designation part
    designation_id: '',
    designation_name: '',
    department: '',
    organization: '',
    office_location: '',
    // inout part
    entry_date: '',
    entry_time: '',
    exit_date: '',
    exit_time: '',
    status: 'Scheduled'
  };

  const {
    query,
    searchInput,
    setSearchInput,
    setPage,
    setLimit,
    setSort,
    setStatus,
  } = useTableQuery({
    sortBy: "entry_date",
    sortOrder: "desc",
  });
  const [guestForm, setGuestForm] = useState<GuestForm>(initialGuestForm);
  const [editGuestForm, setEditGuestForm] = useState<GuestForm>(initialGuestForm);
  const [editGdId, setEditGdId] = useState<string>('');
  const [editInoutId, setEditInoutId] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [totalCount, setTotalCount] = useState(0);

  const guestColumns: Column<ActiveGuestRow>[] = [
    {
      header: "Name",
      accessor: "guest_name",
      sortable: true,
      sortKey: "guest_name",
      render: (g) => (
        <>
          <p className="font-medium">{g.guest_name}</p>
          <p className="text-xs text-gray-500">
            {g.guest_name_local_language}
          </p>
        </>
      ),
    },
    {
      header: "Designation",
      accessor: "designation_name",
      sortable: true,
      sortKey: "designation_name",
    },
    {
      header: "Mobile",
      render: (g) => (
        <>
          <p>{g.guest_mobile}</p>
          <p className="text-xs text-gray-500">
            {g.guest_alternate_mobile}
          </p>
        </>
      ),
    },
    {
      header: "Check-in",
      render: (g) => (
        <>
          <p>{formatDate(g.entry_date)}</p>
          <p className="text-xs text-gray-500">
            {formatTime(g.entry_time)}
          </p>
        </>
      ),
      sortable: true,
      sortKey: "entry_date",
    },
    {
      header: "Check-out",
      render: (g) => (
        <>
          <p>{formatDate(g.exit_date)}</p>
          <p className="text-xs text-gray-500">
            {formatTime(g.exit_time)}
          </p>
        </>
      ),
    },
    {
      header: "Status",
      accessor: "inout_status",
      sortable: true,
      sortKey: "inout_status",
      render: (g) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium
            ${g.inout_status === "Scheduled"
              ? "bg-yellow-100 text-yellow-800"
              : g.inout_status === "Entered"
                ? "bg-green-100 text-green-800"
                : g.inout_status === "Exited"
                  ? "bg-gray-200 text-gray-700"
                  : "bg-blue-100 text-blue-800"
            }`}
        >
          {g.inout_status}
        </span>
      ),
    },
    {
      header: "Purpose",
      accessor: "purpose",
    },
    {
      header: "Actions",
      render: (g) => (
        <div className="flex gap-2">
          <button onClick={() => openView(g)} className="icon-btn text-blue-600">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(g)} className="icon-btn text-green-600">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => {
            setSelectedGuest(g);
            setShowDeleteConfirm(true);
          }} className="icon-btn text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Loading Guests
  useEffect(() => {
    loadGuests();
  }, [query]);

  useEffect(() => {
    fetchGuestStatusCounts().then(setStatusCounts);
  }, []);

  // useEffect(() => {
  //   console.log("Status counts:", statusCounts);
  // }, [statusCounts]);

  useEffect(() => {
    if (modalMode || showView || showDeleteConfirm) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [modalMode, showView, showDeleteConfirm]);


  useEffect(() => {
    if (modalMode !== "add") return;

    getActiveDesignationList()
      .then((data) =>
        setDesignations(
          data.map((d: any) => ({
            designation_id: d.designation_id ?? d.id,
            designation_name: d.designation_name ?? d.name,
            organization: d.organization,
            office_location: d.office_location,
            department: d.department,
          }))
        )
      );
  }, [modalMode])
    useEffect(() => {
    if (modalMode !== "edit") return;

    getActiveDesignationList()
      .then((data) =>
        setDesignations(
          data.map((d: any) => ({
            designation_id: d.designation_id ?? d.id,
            designation_name: d.designation_name ?? d.name,
            organization: d.organization,
            office_location: d.office_location,
            department: d.department,
          }))
        )
      );
  }, [modalMode])


  async function loadGuests() {
    setLoading(true);
    setError(null);

    try {
      const res = await getActiveGuests({
        page: query.page,
        limit: query.limit,
        search: query.search || undefined,
        status: query.status !== "All" ? query.status : undefined,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        entryDateFrom: query.entryDateFrom,
        entryDateTo: query.entryDateTo,
      });

      setGuests(res.data);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error("Failed loading guests", err);
      setError("Failed to load guest data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGuest() {
    setFormErrors({});
    console.log("Submitting", guestForm);

    try {
      // ✅ SINGLE SOURCE OF TRUTH
      const parsed = guestManagementSchema.parse({
        guest_name: guestForm.guest_name,
        guest_name_local_language: guestForm.guest_name_local_language,
        guest_mobile: guestForm.guest_mobile,
        guest_alternate_mobile: guestForm.guest_alternate_mobile,
        guest_address: guestForm.guest_address,
        email: guestForm.email,

        designation_id: guestForm.designation_id || undefined,
        designation_name: guestForm.designation_name || undefined,
        department: guestForm.department || undefined,
        organization: guestForm.organization || undefined,
        office_location: guestForm.office_location || undefined,

        entry_date: guestForm.entry_date,
        entry_time: guestForm.entry_time,
        exit_date: guestForm.exit_date || undefined,
        exit_time: guestForm.exit_time,

        status: guestForm.status,
      });

      const payload = {
        guest: {
          guest_name: parsed.guest_name,
          guest_name_local_language: parsed.guest_name_local_language,
          guest_mobile: parsed.guest_mobile,
          guest_alternate_mobile: parsed.guest_alternate_mobile,
          guest_address: parsed.guest_address,
          email: parsed.email,
        },

        designation:
          designationMode === "existing"
            ? { designation_id: parsed.designation_id }
            : {
              designation_name: parsed.designation_name,
              department: parsed.department,
              organization: parsed.organization,
              office_location: parsed.office_location,
            },

        inout: {
          entry_date: parsed.entry_date,
          entry_time: parsed.entry_time,
          exit_date: parsed.exit_date ?? null,
          exit_time: parsed.exit_time ?? null,
          // status: parsed.status,
          purpose: parsed.purpose || "Visit",
        },
      };

      console.log("Payload being sent:", payload);
      await createGuest(payload);
      setModalMode(null);
      setGuestForm(initialGuestForm);
      await loadGuests();
      await refreshStatusCounts();
      alert("Guest added successfully!");
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach(issue => {
          const field = issue.path.join(".");
          errors[field] = issue.message;
        });
        setFormErrors(errors);
        // console.warn("VALIDATION BLOCKED SUBMIT", errors);
        // alert("Validation failed. Check highlighted fields.");
        return;
      }
    }
  }

  function openView(g: ActiveGuestRow) {
    setSelectedGuest(g);
    setShowView(true);
  }

  function openEdit(g: ActiveGuestRow) {
    setSelectedGuest(g);

    setEditGuestForm({
      guest_name: g.guest_name || "",
      guest_name_local_language: g.guest_name_local_language || "",
      guest_mobile: g.guest_mobile || "",
      guest_alternate_mobile: g.guest_alternate_mobile || "",
      guest_address: g.guest_address || "",
      email: g.email || "",
      designation_id: g.designation_id ?? "",
      designation_name: g.designation_name || "",
      department: g.department || "",
      organization: g.organization || "",
      office_location: g.office_location || "",

      entry_date: g.entry_date ? g.entry_date.toString().split('T')[0] : "",
      entry_time: g.entry_time ? g.entry_time.slice(0, 5) : "",
      exit_date: g.exit_date ? g.exit_date.toString().split('T')[0] : "",
      exit_time: g.exit_time ? g.exit_time.slice(0, 5) : "",

      status: g.inout_status || "Scheduled"
    });

    setEditGdId(g.gd_id || "");
    setEditInoutId(g.inout_id || "");

    setModalMode("edit");
    setDesignationMode(g.designation_id ? "existing" : "other");
  }

  async function submitEdit() {
    if (!selectedGuest) return;

    setFormErrors({});

    try {
      const parsed = guestManagementSchema.parse({
        guest_name: editGuestForm.guest_name,
        guest_name_local_language: editGuestForm.guest_name_local_language,
        guest_mobile: editGuestForm.guest_mobile,
        guest_alternate_mobile: editGuestForm.guest_alternate_mobile,
        guest_address: editGuestForm.guest_address,
        email: editGuestForm.email,

        designation_id: editGuestForm.designation_id || undefined,
        designation_name: editGuestForm.designation_name || undefined,
        department: editGuestForm.department || undefined,
        organization: editGuestForm.organization || undefined,
        office_location: editGuestForm.office_location || undefined,

        entry_date: editGuestForm.entry_date,
        entry_time: editGuestForm.entry_time,
        exit_date: editGuestForm.exit_date || undefined,
        exit_time: editGuestForm.exit_time,

        status: editGuestForm.status,
      });

      // 1️⃣ update guest
      await updateGuest(selectedGuest.guest_id, {
        guest_name: parsed.guest_name,
        guest_name_local_language: parsed.guest_name_local_language,
        guest_mobile: parsed.guest_mobile,
        guest_alternate_mobile: parsed.guest_alternate_mobile,
        guest_address: parsed.guest_address,
        email: parsed.email,
      });

      // 2️⃣ designation
      if (editGdId) {
        await updateGuestDesignation(editGdId, {
          designation_id: parsed.designation_id,
          designation_name: parsed.designation_name,
          department: parsed.department,
          organization: parsed.organization,
          office_location: parsed.office_location,
        });
      } else {
        await createGuestDesignation({
          guest_id: selectedGuest.guest_id,
          designation_id: parsed.designation_id,
          designation_name: parsed.designation_name,
          department: parsed.department,
          organization: parsed.organization,
          office_location: parsed.office_location,
        });
      }

      // 3️⃣ inout
      if (editInoutId) {
        await updateGuestInOut(editInoutId, {
          entry_date: parsed.entry_date,
          entry_time: parsed.entry_time,
          exit_date: parsed.exit_date,
          exit_time: parsed.exit_time,
          status: parsed.status,
        });
      }

      setModalMode(null);
      await loadGuests();
      await refreshStatusCounts();
    } catch (err) {
      if (err instanceof ZodError) {
        console.log("EDIT VALIDATION ERRORS:", err.issues);

        const errors: Record<string, string> = {};
        err.issues.forEach(issue => {
          const field = issue.path.join(".");
          errors[field] = issue.message;
        });
        setFormErrors(errors);
        requestAnimationFrame(() => {
          const firstErrorField = Object.keys(errors)[0];
          const el = document.querySelector(
            `[name="${firstErrorField}"]`
          ) as HTMLElement | null;

          el?.focus();
        });
        return;
      }

      console.error("Edit failed", err);
      alert("Failed to update guest");
    }
  }

  async function handleDelete() {
    if (!selectedGuest) return;
    try {
      // 1) soft delete guest_inout if exists
      if (selectedGuest.inout_id) {
        await softDeleteGuestInOut(selectedGuest.inout_id);
      }
      // 2) soft delete guest row
      await softDeleteGuest(selectedGuest.guest_id);
      setShowDeleteConfirm(false);
      await loadGuests();
      await refreshStatusCounts();
    } catch (err) {
      console.error('delete failed', err);
      alert('Failed to delete entry');
    }
  }

  function validateSingleField(
    field: keyof GuestForm,
    value: any
  ) {
    try {
      guestManagementSchema
        .pick({ [field]: true } as any)
        .parse({ [field]: value });

      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } catch (err) {
      if (err instanceof ZodError) {
        setFormErrors(prev => ({
          ...prev,
          [field]: err.issues[0]?.message,
        }));
      }
    }
  }

  /* =====================================================================
  
  MAIN RENDER
  
  ===================================================================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Guest Management</h2>
          <p className="text-sm text-gray-600">Manage all guest information and visits</p>
        </div>

        <button
          className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center gap-2"
          onClick={() => { setGuestForm(initialGuestForm); setModalMode("add"); }}
        >
          <Plus className="w-5 h-5" />
          Add New Guest
        </button>
      </div>

      {/* SEARCH PANEL */}
      {/* SEARCH + STATUS CARDS */}
      <div className="bg-white border rounded-sm p-6 space-y-4">
        {/* Search stays */}
        <div>
          <label className="text-sm mb-2 block">Search Guest</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, department or ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {GUEST_STATUS_CARDS.map((card) => {
            const Icon = card.icon;
            const active = query.status === card.key;

            return (
              <button
                key={card.key}
                onClick={() => setStatus(card.key)}
                aria-pressed={active}
                className={`
                  border rounded-lg p-4 flex items-center gap-3 transition-all
                  ${active ? "ring-2 ring-blue-600 bg-blue-50" : "hover:bg-gray-50"}
                `}
              >
                <div className={`p-2 rounded-full ${COLOR_STYLES[card.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="text-left">
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-lg font-semibold">
                    {card.key === "All"
                      ? statusCounts?.All ?? 0
                      : statusCounts?.[card.key] ?? 0}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {
        loading && (
          <div className="flex justify-center space-x-2 py-6">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-150"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-300"></div>
          </div>
        )
      }

      {/* TABLE */}
      <div className="bg-white border rounded-sm overflow-hidden">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm">
            {error}
          </div>
        )}
        <DataTable
          data={guests}
          columns={guestColumns}
          keyField="guest_id"
          page={query.page}
          limit={query.limit}
          totalCount={totalCount}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          loading={loading}
          onPageChange={setPage}
          onLimitChange={setLimit}
          onSortChange={setSort}
        />
      </div>

      {/* ------------------------- MODALS BEGIN ------------------------ */}
      {/* VIEW GUEST */}
      {
        showView && selectedGuest && (
          <div className="modalOverlay">
            <div className="modal largeModal">

              <h2>Guest Details</h2>

              {/* BASIC INFO */}
              <div className="section">
                <h3>Basic Information</h3>
                <p><strong>Name:</strong> {selectedGuest.guest_name}</p>
                <p><strong>Mobile:</strong> {selectedGuest.guest_mobile || "N/A"}</p>
                <p><strong>Alternate Mobile:</strong> {selectedGuest.guest_alternate_mobile || "N/A"}</p>
                <p><strong>Email:</strong> {selectedGuest.email || "N/A"}</p>
                <p><strong>Address:</strong> {selectedGuest.guest_address || "N/A"}</p>
              </div>

              {/* DESIGNATION */}
              <div className="section">
                <h3>Designation Details</h3>
                <p><strong>Designation Name:</strong> {selectedGuest.designation_name}</p>
                <p><strong>Department:</strong> {selectedGuest.department}</p>
                <p><strong>Organization:</strong> {selectedGuest.organization}</p>
                <p><strong>Office Location:</strong> {selectedGuest.office_location}</p>
              </div>

              {/* VISIT / IN-OUT */}
              <div className="section">
                <h3>Visit Information</h3>
                <p><strong>Status:</strong> {selectedGuest.inout_status}</p>
                <p><strong>Arrival:</strong>{" "}{formatSeparate(selectedGuest.entry_date, selectedGuest.entry_time)}</p>
                <p><strong>Departure:</strong>{" "}{formatSeparate(selectedGuest.exit_date, selectedGuest.exit_time)}</p>
              </div>

              <div className="modalActions">
                <button onClick={() => setShowView(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

      {/* DELETE GUEST */}
      {showDeleteConfirm && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Confirm Deletion</h3>

            <p>
              Are you sure you want to delete guest <strong>{selectedGuest.guest_name}</strong>? This
              action cannot be undone.
            </p>

            <div className="modalActions">
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>

              <button className="saveBtn" style={{ backgroundColor: "red" }} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )
      }

      {modalMode && (
        <div className="modalOverlay">
          <div className="modal largeModal">
            <h3>{modalMode === "add" ? "Add Guest" : "Edit Guest"}</h3>
            {Object.keys(formErrors).length > 0 && (
              <div className="formErrorBanner">
                Please fix the highlighted fields below.
              </div>
            )}
            {/* FORM BODY */}
            {modalMode === "add" ? (
              <div className="modalBody">
                <div>

                  {/* 2-COLUMN FORM GRID */}
                  <div className="nicFormGrid ">
                    <div className="fullWidth">
                      <label>Full Name *</label>
                      <input
                        name="guest_name"
                        className={`nicInput ${formErrors.guest_name ? "error" : ""}`}
                        value={guestForm.guest_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          setGuestForm(s => ({ ...s, guest_name: value }));
                          validateSingleField("guest_name", value);
                        }}
                        maxLength={50}
                        onKeyUp={() => validateSingleField("guest_name", guestForm.guest_name)}
                      />
                      <p className="errorText">{formErrors.guest_name}</p>
                    </div>

                    {/* <div>
                          <label>Name (Local Language)</label>
                          <input className="nicInput" value={guestForm.guest_name_local_language} onChange={(e) => setGuestForm(s => ({ ...s, guest_name_local_language: e.target.value }))} />
                        </div> */}

                    <div className="fullWidth">
                      <label>Designation *</label>
                      <select
                        name="designation_id"
                        className="nicInput"
                        value={designationMode === "other" ? "OTHER" : guestForm.designation_id}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === "OTHER") {
                            setDesignationMode("other");
                            setGuestForm((s) => ({
                              ...s,
                              designation_id: "",
                              designation_name: "",
                              organization: "",
                              office_location: "",
                              department: "",
                            }));
                            return;
                          }

                          const selected = designations.find(d => d.designation_id === value);
                          if (!selected) return;

                          setDesignationMode("existing");
                          setGuestForm((s) => ({
                            ...s,
                            designation_id: selected.designation_id,
                            designation_name: selected.designation_name,
                            organization: selected.organization ?? "",
                            office_location: selected.office_location ?? "",
                            department: selected.department ?? "",
                          }));
                        }}
                      // onKeyUp={() => validateSingleField("designation_id", guestForm.designation_id)}
                      >
                        <option value="">Select designation *</option>

                        {designations.map((d) => (
                          <option key={d.designation_id} value={d.designation_id}>
                            {d.designation_name}
                          </option>
                        ))}

                        <option value="OTHER">Other</option>
                      </select>

                      <p className="errorText">{formErrors.designation_id}</p>
                    </div>
                    {designationMode === "other" && (
                      <>
                        <div>
                          <label>Designation Name *</label>
                          <input
                            className={`nicInput ${formErrors.designation_name ? "error" : ""}`}
                            value={guestForm.designation_name}
                            onChange={(e) =>
                              setGuestForm(s => ({ ...s, designation_name: e.target.value }))
                            }
                            onKeyUp={() => validateSingleField("designation_name", guestForm.designation_name)}
                          />
                          <p className="errorText">{formErrors.designation_name}</p>
                        </div>

                        {/* <div>
                            <label>Designation ID *</label>
                            <input
                            className={`nicInput ${formErrors.designation_id ? "error" : ""}`}
                            value={guestForm.designation_id}
                            onChange={(e) =>
                            setGuestForm(s => ({ ...s, designation_id: e.target.value }))
                            }
                            />
                            <p className="errorText">{formErrors.designation_id}</p>
                            </div> */}

                        <div>
                          <label>Organization *</label>
                          <input
                            className="nicInput"
                            value={guestForm.organization}
                            onChange={(e) =>
                              setGuestForm(s => ({ ...s, organization: e.target.value }))
                            }
                            onKeyUp={() => validateSingleField("organization", guestForm.organization)}
                          />
                          <p className="errorText">{formErrors.organization}</p>
                        </div>

                        <div>
                          <label>Office Location *</label>
                          <input
                            className="nicInput"
                            value={guestForm.office_location}
                            onChange={(e) =>
                              setGuestForm(s => ({ ...s, office_location: e.target.value }))
                            }
                            onKeyUp={() => validateSingleField("office_location", guestForm.office_location)}
                          />
                          <p className="errorText">{formErrors.office_location}</p>
                        </div>
                      </>
                    )}
                    {/* <div>
                        <label>Designation Id</label>
                        <input 
                          name="designation_id"
                          className="nicInput" 
                          value={guestForm.designation_id} 
                          onChange={(e) => setGuestForm(s => ({ ...s, designation_id: e.target.value }))} 
                          onKeyUp={() => validateSingleField("designation_id", guestForm.designation_id)}
                        />
                        <p className="errorText">{formErrors.designation_id}</p>
                        </div>

                        <div>
                        <label>Designation Name</label>
                        <input 
                          name="designation_name"
                          className="nicInput" 
                          value={guestForm.designation_name} 
                          onChange={(e) => setGuestForm(s => ({ ...s, designation_name: e.target.value }))} 
                          onKeyUp={() => validateSingleField("designation_name", guestForm.designation_name)}
                        />
                        <p className="errorText">{formErrors.designation_name}</p>
                        </div>

                        <div>
                        <label>Organization</label>
                        <input 
                          name="organization"
                          className="nicInput" 
                          value={guestForm.organization} 
                          onChange={(e) => setGuestForm(s => ({ ...s, organization: e.target.value }))} 
                          onKeyUp={() => validateSingleField("organization", guestForm.organization)}
                        />
                        <p className="errorText">{formErrors.organization}</p>
                        </div>

                        <div>
                        <label>Office Location</label>
                        <input 
                          name="office_location"
                          className="nicInput" 
                          value={guestForm.office_location} 
                          onChange={(e) => setGuestForm(s => ({ ...s, office_location: e.target.value }))} 
                          onKeyUp={() => validateSingleField("office_location", guestForm.office_location)}
                        />
                        <p className="errorText">{formErrors.office_location}</p>
                        </div> */}

                    <div>
                      <label>Mobile Number *</label>
                      <input
                        name="guest_mobile"
                        className={`nicInput ${formErrors.guest_mobile ? "error" : ""}`}
                        placeholder="10-digit mobile number"
                        value={guestForm.guest_mobile}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          setGuestForm(s => ({ ...s, guest_mobile: value }));
                        }}
                        maxLength={10}
                        onKeyUp={() => validateSingleField("guest_mobile", guestForm.guest_mobile)}
                      />
                      <p className="errorText">{formErrors.guest_mobile}</p>
                    </div>

                    <div>
                      <label>Alternate Mobile</label>
                      <input
                        name="guest_alternate_mobile"
                        className="nicInput"
                        value={guestForm.guest_alternate_mobile}
                        onChange={(e) => setGuestForm(s => ({ ...s, guest_alternate_mobile: e.target.value }))}
                        onKeyUp={() => validateSingleField("guest_alternate_mobile", guestForm.guest_alternate_mobile)}
                        maxLength={0|10}
                      />
                      <p className="errorText">{formErrors.guest_alternate_mobile}</p>
                    </div>

                    {/* Full width field */}
                    <div className="fullWidth">
                      <label>Address</label>
                      <textarea
                        name="guest_address"
                        className="nicInput"
                        value={guestForm.guest_address}
                        onChange={(e) => setGuestForm(s => ({ ...s, guest_address: e.target.value }))}
                        onKeyUp={() => validateSingleField("guest_address", guestForm.guest_address)}
                        maxLength={250}
                      />
                      <p className="errorText">{formErrors.guest_address}</p>
                    </div>

                    {/* Check-in Date */}
                    <div>
                      <label>Check-in Date *</label>
                      <input
                        name="entry_date"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        className={`nicInput ${formErrors.entry_date ? "error" : ""}`}
                        value={guestForm.entry_date}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          setGuestForm(s => ({ ...s, entry_date: value }));
                          validateSingleField("entry_date", value);
                        }}
                        onKeyUp={() => validateSingleField("entry_date", guestForm.entry_date)}
                      />
                      <p className="errorText">{formErrors.entry_date}</p>
                    </div>

                    <div>
                      <TimePicker12h
                        name="entry_time"
                        label="Check-in Time *"
                        value={guestForm.entry_time}
                        onChange={(value: string) =>
                          setGuestForm(s => ({ ...s, entry_time: value }))
                        }
                        onBlur={() => validateSingleField("entry_time", guestForm.entry_time)}
                      />
                      <p className="errorText">{formErrors.entry_time}</p>
                    </div>

                    {/* Check-out Date */}
                    <div>
                      <label>Check-out Date *</label>
                      <input
                        name="checkout_date"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        className="nicInput"
                        value={guestForm.exit_date}
                        onChange={(e) =>
                          setGuestForm((s) => ({ ...s, exit_date: e.target.value }))
                        }
                        onKeyUp={() => validateSingleField("exit_date", guestForm.exit_date)}
                      />
                      <p className="errorText">{formErrors.exit_date}</p>
                    </div>

                    <div>
                      <TimePicker12h
                        name="exit_time"
                        label="Check-out Time"
                        value={guestForm.exit_time}
                        onChange={(value: string) =>
                          setGuestForm(s => ({ ...s, exit_time: value }))
                        }
                        onBlur={() => validateSingleField("exit_time", guestForm.exit_time)}
                      />
                      <p className="errorText">{formErrors.exit_time}</p>
                    </div>

                    {/* <div>
                      <label>Status *</label>
                      <select
                        name="status"
                        className="nicInput"
                        value={guestForm.status}
                        onChange={(e) =>
                          setGuestForm(s => ({ ...s, status: e.target.value }))
                        }
                        onKeyUp={() => validateSingleField("status", guestForm.status)}
                      >
                        {GUEST_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <p className="errorText">{formErrors.status}</p>
                    </div> */}


                    <div className="fullWidth">
                      <label>Email</label>
                      <input
                        name="email"
                        className={`nicInput ${formErrors.email ? "error" : ""}`}
                        value={guestForm.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          setGuestForm(s => ({ ...s, email: value }));
                        }}
                        onKeyUp={() => validateSingleField("email", guestForm.email)}
                      />
                      <p className="errorText">{formErrors.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="modalBody">
                <div>

                  {/* 2-COLUMN FORM GRID */}
                  <div className="nicFormGrid ">
                    <div className="fullWidth">
                      <label>Full Name *</label>
                      <input
                        name="guest_name"
                        className={`nicInput ${formErrors.guest_name ? "error" : ""}`}
                        value={editGuestForm.guest_name}
                        onChange={(e) =>
                          setEditGuestForm({ ...editGuestForm, guest_name: e.target.value })
                        }
                        onKeyUp={() => validateSingleField("guest_name", editGuestForm.guest_name)}
                        maxLength={50}
                      />
                      <p className="errorText">{formErrors.guest_name}</p>
                    </div>

                    {/* <div>
                          <label>Name (Local Language)</label>
                          <input className="nicInput" value={guestForm.guest_name_local_language} onChange={(e) => setGuestForm(s => ({ ...s, guest_name_local_language: e.target.value }))} />
                        </div> */}

                    <div className="fullWidth">
                      <label>Designation *</label>
                      <select
                        name="designation_id"
                        className="nicInput"
                        value={designationMode === "other" ? "OTHER" : editGuestForm.designation_id}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === "OTHER") {
                            setDesignationMode("other");
                            setEditGuestForm((s) => ({
                              ...s,
                              designation_id: "",
                              designation_name: "",
                              department: "",
                              organization: "",
                              office_location: "",
                            }));
                            return;
                          }

                          const selected = designations.find(d => d.designation_id === value);
                          if (!selected) return;

                          setDesignationMode("existing");
                          setEditGuestForm((s) => ({
                            ...s,
                            designation_id: selected.designation_id,
                            designation_name: selected.designation_name,
                            department: selected.department ?? "",
                            organization: selected.organization ?? "",
                            office_location: selected.office_location ?? "",
                          }));
                        }}
                      >
                        <option value="">Select designation *</option>

                        {designations.map((d) => (
                          <option key={d.designation_id} value={d.designation_id}>
                            {d.designation_name}
                          </option>
                        ))}

                        <option value="OTHER">Other</option>
                      </select>

                      <p className="errorText">{formErrors.designation_id}</p>

                      <p className="errorText">{formErrors.designation_id}</p>
                    </div>

                    {designationMode === "other" && (
                      <>
                        <div>
                          <label>Designation Name *</label>
                          <input
                            className={`nicInput ${formErrors.designation_name ? "error" : ""}`}
                            value={editGuestForm.designation_name}
                            onChange={(e) =>
                              setEditGuestForm(s => ({ ...s, designation_name: e.target.value }))
                            }
                          />
                          <p className="errorText">{formErrors.designation_name}</p>
                        </div>

                        <div>
                          <label>Department</label>
                          <input
                            className="nicInput"
                            value={editGuestForm.department}
                            onChange={(e) =>
                              setEditGuestForm(s => ({ ...s, department: e.target.value }))
                            }
                          />
                        </div>

                        <div>
                          <label>Organization *</label>
                          <input
                            className="nicInput"
                            value={editGuestForm.organization}
                            onChange={(e) =>
                              setEditGuestForm(s => ({ ...s, organization: e.target.value }))
                            }
                          />
                          <p className="errorText">{formErrors.organization}</p>
                        </div>

                        <div>
                          <label>Office Location *</label>
                          <input
                            className="nicInput"
                            value={editGuestForm.office_location}
                            onChange={(e) =>
                              setEditGuestForm(s => ({ ...s, office_location: e.target.value }))
                            }
                          />
                          <p className="errorText">{formErrors.office_location}</p>
                        </div>
                      </>
                    )}

                    <div>
                      <label>Mobile Number *</label>
                      <input
                        name="guest_mobile"
                        className="nicInput"
                        value={editGuestForm.guest_mobile}
                        onChange={(e) =>
                          setEditGuestForm({ ...editGuestForm, guest_mobile: e.target.value })
                        }
                        onKeyUp={() => validateSingleField("guest_mobile", editGuestForm.guest_mobile)}
                        maxLength={10}
                      />
                      <p className="errorText">{formErrors.guest_mobile}</p>
                    </div>

                    <div>
                      <label>Alternate Mobile</label>
                      <input
                        name="guest_alternate_mobile"
                        className="nicInput"
                        value={editGuestForm.guest_alternate_mobile}
                        onChange={(e) =>
                          setEditGuestForm({ ...editGuestForm, guest_alternate_mobile: e.target.value })
                        }
                        onKeyUp={() => validateSingleField("guest_alternate_mobile", editGuestForm.guest_alternate_mobile)}
                        maxLength={0 | 10}
                    />
                      <p className="errorText">{formErrors.guest_alternate_mobile}</p>
                    </div>

                    {/* Full width field */}
                    <div className="fullWidth">
                      <label>Address</label>
                      <textarea
                        name="guest_address"
                        className="nicInput"
                        value={guestForm.guest_address}
                        onChange={(e) => setGuestForm(s => ({ ...s, guest_address: e.target.value }))}
                        onKeyUp={() => validateSingleField("guest_address", guestForm.guest_address)}
                        maxLength={250}
                      />
                      <p className="errorText">{formErrors.guest_address}</p>
                    </div>

                    {/* Check-in Date */}
                    <div>
                      <label>Check-in Date *</label>
                      <input
                        name="entry_date"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        className={`nicInput ${formErrors.entry_date ? "error" : ""}`}
                        value={editGuestForm.entry_date}
                        onChange={(e) =>
                          setEditGuestForm(s => ({ ...s, entry_date: e.target.value }))
                        }
                        onKeyUp={() => validateSingleField("entry_date", editGuestForm.entry_date)}
                      />
                      <p className="errorText">{formErrors.entry_date}</p>
                    </div>

                    <div>
                      <TimePicker12h
                        name="entry_time"
                        label="Check-in Time *"
                        value={editGuestForm.entry_time}
                        onChange={(value: string) =>
                          setEditGuestForm(s => ({ ...s, entry_time: value }))
                        }
                        onBlur={() => validateSingleField("entry_time", editGuestForm.entry_time)}
                      />
                      <p className="errorText">{formErrors.entry_time}</p>
                    </div>

                    {/* Check-out Date */}
                    <div>
                      <label>Check-out Date *</label>
                      <input
                        name="checkout_date"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        className="nicInput"
                        value={editGuestForm.exit_date}
                        onChange={(e) =>
                          setEditGuestForm(s => ({ ...s, exit_date: e.target.value }))
                        }
                        onKeyUp={() => validateSingleField("exit_date", editGuestForm.exit_date)}
                      />
                      <p className="errorText">{formErrors.exit_date}</p>
                    </div>

                    <div>
                      <TimePicker12h
                        name="exit_time"
                        label="Check-out Time"
                        value={editGuestForm.exit_time}
                        onChange={(value: string) =>
                          setEditGuestForm(s => ({ ...s, exit_time: value }))
                        }
                        onBlur={() => validateSingleField("exit_time", editGuestForm.exit_time)}
                      />
                      <p className="errorText">{formErrors.exit_time}</p>
                    </div>

                    <div>
                      <label>Status *</label>
                      <select
                        name="status"
                        className="nicInput"
                        value={editGuestForm.status}
                        onChange={(e) =>
                          setEditGuestForm(s => ({ ...s, status: e.target.value }))
                        }
                        onKeyUp={() => validateSingleField("status", editGuestForm.status)}
                      >
                        {GUEST_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <p className="errorText">{formErrors.status}</p>
                    </div>


                    <div className="fullWidth">
                      <label>Email</label>
                      <input
                        name="email"
                        className={`nicInput ${formErrors.email ? "error" : ""}`}
                        value={editGuestForm.email}
                        onChange={(e) =>
                          setEditGuestForm(s => ({ ...s, email: e.target.value }))
                        }
                        onKeyUp={() => validateSingleField("email", editGuestForm.email)}
                      />
                      <p className="errorText">{formErrors.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="modalActions">
              <button onClick={() => setModalMode(null)}>Cancel</button>

              {modalMode === "add" ? (
                <button className="saveBtn" onClick={() => { handleAddGuest(); console.log("button clicked") }}>
                  Add Guest
                </button>
              ) : (
                <button className="saveBtn" onClick={submitEdit}>
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default GuestManagement;