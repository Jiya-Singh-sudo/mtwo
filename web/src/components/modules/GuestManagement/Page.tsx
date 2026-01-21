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
import { GUEST_STATUS_CARDS } from "@/utils/guestCards";
import { StatCard } from "@/components/ui/StatCard";
import { X } from "lucide-react";
import { XCircle } from "lucide-react";
import { validateSingleField } from "@/utils/validateSingleField";


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
  const ViewRow = ({
    label,
    value,
    full = false,
    badge = false,
  }: {
    label: string;
    value?: string | null;
    full?: boolean;
    badge?: boolean;
  }) => (
    <div className={`viewRow ${full ? "full" : ""}`}>
      <div className="viewLabel">{label}</div>

      <div className="viewValue">
        {badge ? (
          <span className={`statusBadge ${value?.toLowerCase()}`}>
            {value || "—"}
          </span>
        ) : (
          value || "—"
        )}
      </div>
    </div>
  );

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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelGuest, setCancelGuest] = useState<ActiveGuestRow | null>(null);

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
          {/* View */}
          <button
            onClick={() => openView(g)}
            className="icon-btn text-blue-600"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit */}
          <button
            onClick={() => openEdit(g)}
            className="icon-btn text-green-600"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Cancel Visit (ONLY if Scheduled) */}
          {g.inout_status === "Scheduled" && (
            <button
              onClick={() => {
                setCancelGuest(g);
                setShowCancelConfirm(true);
              }}
              className="icon-btn text-orange-600"
              title="Cancel Visit"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => {
              setSelectedGuest(g);
              setShowDeleteConfirm(true);
            }}
            className="icon-btn text-red-600"
            title="Delete"
          >
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

  // function validateSingleField(
  //   field: keyof GuestForm,
  //   value: any
  // ) {
  //   try {
  //     guestManagementSchema
  //       .pick({ [field]: true } as any)
  //       .parse({ [field]: value });

  //     setFormErrors(prev => {
  //       const next = { ...prev };
  //       delete next[field];
  //       return next;
  //     });
  //   } catch (err) {
  //     if (err instanceof ZodError) {
  //       setFormErrors(prev => ({
  //         ...prev,
  //         [field]: err.issues[0]?.message,
  //       }));
  //     }
  //   }
  // }
  async function confirmCancelVisit() {
    if (!cancelGuest?.inout_id) return;

    try {
      await updateGuestInOut(cancelGuest.inout_id, {
        status: "Cancelled",
      });

      setShowCancelConfirm(false);
      setCancelGuest(null);

      await loadGuests();
      await refreshStatusCounts();
    } catch (err) {
      console.error("Cancel visit failed", err);
      alert("Failed to cancel visit");
    }
  }



  /* =====================================================================
  
  MAIN RENDER
  
  ===================================================================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-[#00247D] font-semibold text-xl">Guest Management</h2>
        <p className="text-gray-600 text-sm">Manage all guest information and visits</p>
      </div>

      {/* STATUS CARDS */}
      <div className="statsGrid">
        {GUEST_STATUS_CARDS.map((card) => (
          <StatCard
            key={card.key}
            title={card.label}
            value={
              card.key === "All"
                ? statusCounts?.All ?? 0
                : statusCounts?.[card.key] ?? 0
            }
            icon={card.icon}
            variant={card.color}
            active={query.status === card.key}
            onClick={() => setStatus(card.key)}
          />
        ))}
      </div>

      {/* SEARCH + ADD GUEST (SAME AS ROOM / ROOM BOY) */}
      <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
          maxLength={300}
            type="text"
            placeholder="Search by name, department or ID..."
            className="pl-10 pr-3 py-2 w-full border rounded-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Add Guest Button */}
        <button
          className="bg-[#00247D] text-white btn-icon-text hover:bg-blue-900"
          onClick={() => {
            setGuestForm(initialGuestForm);
            setModalMode("add");
          }}
        >
          <Plus className="w-4 h-4" />
          Add New Guest
        </button>
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
      {showView && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal largeModal wide">
            <div className="viewModalHeader">
              <h2>Guest Details</h2>

              <button
                className="viewCloseBtn"
                onClick={() => setShowView(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>


            <div className="modalBody">
              <div className="detailGridHorizontal">

                {/* BASIC INFORMATION */}
                <div className="viewSection">
                  <h3>Basic Information</h3>
                  <div className="viewFormGrid">
                    <ViewRow label="Full Name" value={selectedGuest.guest_name} />
                    <ViewRow label="Mobile Number" value={selectedGuest.guest_mobile} />
                    <ViewRow label="Alternate Mobile" value={selectedGuest.guest_alternate_mobile} />
                    <ViewRow label="Email" value={selectedGuest.email} />
                    <ViewRow label="Address" value={selectedGuest.guest_address} full />
                  </div>
                </div>

                {/* DESIGNATION */}
                <div className="viewSection">
                  <h3>Designation Details</h3>
                  <div className="viewFormGrid">
                    <ViewRow label="Designation Name" value={selectedGuest.designation_name} />
                    <ViewRow label="Department" value={selectedGuest.department} />
                    <ViewRow label="Organization" value={selectedGuest.organization} />
                    <ViewRow label="Office Location" value={selectedGuest.office_location} />
                  </div>
                </div>

                {/* VISIT */}
                <div className="viewSection">
                  <h3>Visit Information</h3>
                  <div className="viewFormGrid">
                    <ViewRow label="Status" value={selectedGuest.inout_status} badge />
                    <ViewRow
                      label="Arrival"
                      value={formatSeparate(selectedGuest.entry_date, selectedGuest.entry_time)}
                    />
                    <ViewRow
                      label="Departure"
                      value={formatSeparate(selectedGuest.exit_date, selectedGuest.exit_time)}
                    />
                  </div>
                </div>

              </div>
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
      {/* CANCEL VISIT */}
      {showCancelConfirm && cancelGuest && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Cancel Visit</h3>

            <p>
              Are you sure you want to cancel the visit for{" "}
              <strong>{cancelGuest.guest_name}</strong>?
              <br />
              The guest has not arrived.
            </p>

            <div className="modalActions">
              <button onClick={() => {
                setShowCancelConfirm(false);
                setCancelGuest(null);
              }}>
                No
              </button>

              <button
                className="saveBtn"
                style={{ backgroundColor: "#f59e0b" }} // orange
                onClick={confirmCancelVisit}
              >
                Yes, Cancel Visit
              </button>
            </div>
          </div>
        </div>
      )}


      {modalMode && (
        <div className="modalOverlay">
          <div className="modal largeModal wide">
            <div className="viewModalHeader">
              <h2>{modalMode === "add" ? "Add Guest" : "Edit Guest"}</h2>

              <button
                className="viewCloseBtn"
                onClick={() => setModalMode(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            {Object.keys(formErrors).length > 0 && (
              <div className="alert alert-error">
                <div className="alert-icon">
                  <XCircle size={18} />
                </div>

                <span className="alert-text">
                  Please fix the highlighted fields below.
                </span>

                <button
                  className="alert-close"
                  onClick={() => setFormErrors({})}
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* FORM BODY */}
            {modalMode === "add" ? (
              <div className="modalBody">
                <div>

                  {/* 2-COLUMN FORM GRID */}
                  <div className="nicFormGrid ">
                    <div className="fullWidth">
                      <label>Full Name <span className="required">*</span></label>
                      <input
                        name="guest_name"
                        className={`nicInput ${formErrors.guest_name ? "error" : ""}`}
                        value={guestForm.guest_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          setGuestForm(s => ({ ...s, guest_name: value }));
                          validateSingleField(guestManagementSchema, "guest_name", value, setFormErrors);
                        }}
                        maxLength={50}
                        onKeyUp={() => validateSingleField(guestManagementSchema, "guest_name", guestForm.guest_name, setFormErrors)}
                      />
                      {formErrors.guest_name && (
                        <div className="fieldError">
                          <XCircle size={14} />
                          <span>{formErrors.guest_name}</span>
                        </div>
                      )}

                    </div>

                    {/* <div>
                          <label>Name (Local Language)</label>
                          <input className="nicInput" value={guestForm.guest_name_local_language} onChange={(e) => setGuestForm(s => ({ ...s, guest_name_local_language: e.target.value }))} />
                        </div> */}

                    <div className="fullWidth">
                      <label>Designation <span className="required">*</span></label>
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

                      {/* <p className="errorText">{formErrors.designation_id}</p> */}
                      {formErrors.designation_id && (
                        <div className="fieldError">
                          <XCircle size={14} />
                          <span>{formErrors.designation_id}</span>
                        </div>
                      )}

                    </div>
                    {designationMode === "other" && (
                      <>
                        <div>
                          <label>Designation Name <span className="required">*</span></label>
                          <input
                            className={`nicInput ${formErrors.designation_name ? "error" : ""}`}
                            value={guestForm.designation_name}
                            onChange={(e) =>
                              setGuestForm(s => ({ ...s, designation_name: e.target.value }))
                            }
                            onKeyUp={() => validateSingleField(guestManagementSchema, "designation_name", guestForm.designation_name, setFormErrors)}
                          />
                          {/* <p className="errorText">{formErrors.designation_name}</p> */}
                          {formErrors.designation_name && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.designation_name}</span>
  </div>
)}

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
                          <label>Organization <span className="required">*</span></label>
                          <input
                            className="nicInput"
                            value={guestForm.organization}
                            onChange={(e) =>
                              setGuestForm(s => ({ ...s, organization: e.target.value }))
                            }
                            onKeyUp={() => validateSingleField(guestManagementSchema, "organization", guestForm.organization, setFormErrors)}
                          />
                          {/* <p className="errorText">{formErrors.organization}</p> */}
                          {formErrors.organization && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.organization}</span>
  </div>
)}

                        </div>

                        <div>
                          <label>Office Location <span className="required">*</span></label>
                          <input
                            className="nicInput"
                            value={guestForm.office_location}
                            onChange={(e) =>
                              setGuestForm(s => ({ ...s, office_location: e.target.value }))
                            }
                            onKeyUp={() => validateSingleField(guestManagementSchema, "office_location", guestForm.office_location, setFormErrors)}
                          />
                          {/* <p className="errorText">{formErrors.office_location}</p> */}
                          {formErrors.office_location && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.office_location}</span>
  </div>
)}

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
                      <label>Mobile Number <span className="required">*</span></label>
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
                        onKeyUp={() => validateSingleField(guestManagementSchema, "guest_mobile", guestForm.guest_mobile, setFormErrors)}
                      />
                    {/* <p className="errorText">{formErrors.guest_mobile}</p> */}
                    {formErrors.guest_mobile && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.guest_mobile}</span>
  </div>
)}

                    </div>

                    <div>
                      <label>Alternate Mobile</label>
                      <input
                        name="guest_alternate_mobile"
                        className="nicInput"
                        value={guestForm.guest_alternate_mobile}
                        onChange={(e) => setGuestForm(s => ({ ...s, guest_alternate_mobile: e.target.value }))}
                        onKeyUp={() => validateSingleField(guestManagementSchema, "guest_alternate_mobile", guestForm.guest_alternate_mobile, setFormErrors)}
                        maxLength={0 | 10}
                      />
                      {/* <p className="errorText">{formErrors.guest_alternate_mobile}</p> */}
                      {formErrors.guest_alternate_mobile && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.guest_alternate_mobile}</span>
  </div>
)}

                    </div>

                    {/* Full width field */}
                    <div className="fullWidth">
                      <label>Address</label>
                      <textarea
                        name="guest_address"
                        className="nicInput"
                        value={guestForm.guest_address}
                        onChange={(e) => setGuestForm(s => ({ ...s, guest_address: e.target.value }))}
                        onKeyUp={() => validateSingleField(guestManagementSchema, "guest_address", guestForm.guest_address, setFormErrors)}
                        maxLength={250}
                      />
                      {/* <p className="errorText">{formErrors.guest_address}</p> */}
                      {formErrors.guest_address && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.guest_address}</span>
  </div>
)}

                    </div>

                    {/* Check-in Date */}
                    <div>
                      <label>Check-in Date <span className="required">*</span></label>
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
                          validateSingleField(guestManagementSchema, "entry_date", value, setFormErrors);
                        }}
                        onKeyUp={() => validateSingleField(guestManagementSchema, "entry_date", guestForm.entry_date, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.entry_date}</p> */}
                      {formErrors.entry_date && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.entry_date}</span>
  </div>
)}

                    </div>

                    <div>
                      <TimePicker12h
                        name="entry_time"
                        label="Check-in Time *"
                        value={guestForm.entry_time}
                        onChange={(value: string) =>
                          setGuestForm(s => ({ ...s, entry_time: value }))
                        }
                        onBlur={() => validateSingleField(guestManagementSchema, "entry_time", guestForm.entry_time, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.entry_time}</p> */}
                      {formErrors.entry_time && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.entry_time}</span>
  </div>
)}

                    </div>

                    {/* Check-out Date */}
                    <div>
                      <label>Check-out Date <span className="required">*</span></label>
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
                        onKeyUp={() => validateSingleField(guestManagementSchema, "exit_date", guestForm.exit_date, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.exit_date}</p> */}
                      {formErrors.exit_date && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.exit_date}</span>
  </div>
)}

                    </div>

                    <div>
                      <TimePicker12h
                        name="exit_time"
                        label={<>Check-out Time <span className="required">*</span></>}
                        value={guestForm.exit_time}
                        onChange={(value: string) =>
                          setGuestForm(s => ({ ...s, exit_time: value }))
                        }
                        onBlur={() => validateSingleField(guestManagementSchema, "exit_time", guestForm.exit_time, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.exit_time}</p> */}
                      {formErrors.exit_time && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.exit_time}</span>
  </div>
)}

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
                      <label>
                        Email
                        <span className="required">*</span>
                      </label>
                      <input
                        name="email"
                        className={`nicInput ${formErrors.email ? "error" : ""}`}
                        value={guestForm.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          setGuestForm(s => ({ ...s, email: value }));
                        }}
                        onKeyUp={() => validateSingleField(guestManagementSchema, "email", guestForm.email, setFormErrors)}
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
                      <label>Full Name <span className="required">*</span></label>
                      <input
                        name="guest_name"
                        className={`nicInput ${formErrors.guest_name ? "error" : ""}`}
                        value={editGuestForm.guest_name}
                        onChange={(e) =>
                          setEditGuestForm({ ...editGuestForm, guest_name: e.target.value })
                        }
                        onKeyUp={() => validateSingleField(guestManagementSchema, "guest_name", editGuestForm.guest_name, setFormErrors)}
                        maxLength={50}
                      />
                      <p className="errorText">{formErrors.guest_name}</p>
                    </div>

                    {/* <div>
                          <label>Name (Local Language)</label>
                          <input className="nicInput" value={guestForm.guest_name_local_language} onChange={(e) => setGuestForm(s => ({ ...s, guest_name_local_language: e.target.value }))} />
                        </div> */}

                    <div className="fullWidth">
                      <label>Designation <span className="required">*</span></label>
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
                          <label>Designation Name <span className="required">*</span></label>
                          <input
                            className={`nicInput ${formErrors.designation_name ? "error" : ""}`}
                            value={editGuestForm.designation_name}
                            onChange={(e) =>
                              setEditGuestForm(s => ({ ...s, designation_name: e.target.value }))
                            }
                          />
                          {/* <p className="errorText">{formErrors.designation_name}</p> */}
                          {formErrors.designation_name && (
                            <div className="fieldError">
                              <XCircle size={14} />
                              <span>{formErrors.designation_name}</span>
                            </div>
                          )}
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
                          <label>Organization <span className="required">*</span></label>
                          <input
                            className="nicInput"
                            value={editGuestForm.organization}
                            onChange={(e) =>
                              setEditGuestForm(s => ({ ...s, organization: e.target.value }))
                            }
                          />
                          {/* <p className="errorText">{formErrors.organization}</p> */}
                          {formErrors.organization && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.organization}</span>
  </div>
)}

                        </div>

                        <div>
                          <label>Office Location <span className="required">*</span></label>
                          <input
                            className="nicInput"
                            value={editGuestForm.office_location}
                            onChange={(e) =>
                              setEditGuestForm(s => ({ ...s, office_location: e.target.value }))
                            }
                          />
                          {/* <p className="errorText">{formErrors.office_location}</p> */}
                          {formErrors.office_location && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.office_location}</span>
  </div>
)}

                        </div>
                      </>
                    )}

                    <div>
                      <label>Mobile Number <span className="required">*</span></label>
                      <input
                        name="guest_mobile"
                        className="nicInput"
                        value={editGuestForm.guest_mobile}
                        onChange={(e) =>
                          setEditGuestForm({ ...editGuestForm, guest_mobile: e.target.value })
                        }
                        onKeyUp={() => validateSingleField(guestManagementSchema, "guest_mobile", editGuestForm.guest_mobile, setFormErrors)}
                        maxLength={10}
                      />
                      {/* <p className="errorText">{formErrors.guest_mobile}</p> */}
                      {formErrors.guest_mobile && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.guest_mobile}</span>
  </div>
)}

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
                        onKeyUp={() => validateSingleField(guestManagementSchema, "guest_alternate_mobile", editGuestForm.guest_alternate_mobile, setFormErrors)}
                        maxLength={0 | 10}
                      />
                      {/* <p className="errorText">{formErrors.guest_alternate_mobile}</p> */}
                      {formErrors.guest_alternate_mobile && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.guest_alternate_mobile}</span>
  </div>
)}

                    </div>

                    {/* Full width field */}
                    <div className="fullWidth">
                      <label>Address</label>
                      <textarea
                        name="guest_address"
                        className="nicInput"
                        value={editGuestForm.guest_address}
                        onChange={(e) => setEditGuestForm(s => ({ ...s, guest_address: e.target.value }))}
                        onKeyUp={() => validateSingleField(guestManagementSchema, "guest_address", editGuestForm.guest_address, setFormErrors)}
                        maxLength={250}
                      />
                      {/* <p className="errorText">{formErrors.guest_address}</p> */}
                      {formErrors.guest_address && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.guest_address}</span>
  </div>
)}

                    </div>

                    {/* Check-in Date */}
                    <div>
                      <label>Check-in Date <span className="required">*</span></label>
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
                        onKeyUp={() => validateSingleField(guestManagementSchema, "entry_date", editGuestForm.entry_date, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.entry_date}</p> */}
                      {formErrors.entry_date && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.entry_date}</span>
  </div>
)}

                    </div>

                    <div>
                      <TimePicker12h
                        name="entry_time"
                        label={<>Check-in Time <span className="required">*</span></>}
                        value={editGuestForm.entry_time}
                        onChange={(value: string) =>
                          setEditGuestForm(s => ({ ...s, entry_time: value }))
                        }
                        onBlur={() => validateSingleField(guestManagementSchema, "entry_time", editGuestForm.entry_time, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.entry_time}</p> */}
                      {formErrors.entry_time && (
  <div className="fieldError">
    <XCircle size={14} />
    <span>{formErrors.entry_time}</span>
  </div>
)}

                    </div>

                    {/* Check-out Date */}
                    <div>
                      <label>Check-out Date <span className="required">*</span></label>
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
                        onKeyUp={() => validateSingleField(guestManagementSchema, "exit_date", editGuestForm.exit_date, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.exit_date}</p> */}
                      {formErrors.exit_date && (
                        <div className="fieldError">
                          <XCircle size={14} />
                          <span>{formErrors.exit_date}</span>
                        </div>
                      )}

                    </div>

                    <div>
                      <TimePicker12h
                        name="exit_time"
                        label={<>Check-out Time <span className="required">*</span></>}
                        value={editGuestForm.exit_time}
                        onChange={(value: string) =>
                          setEditGuestForm(s => ({ ...s, exit_time: value }))
                        }
                        onBlur={() => validateSingleField(guestManagementSchema, "exit_time", editGuestForm.exit_time, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.exit_time}</p> */}
                      {formErrors.exit_time && (
                        <div className="fieldError">
                          <XCircle size={14} />
                          <span>{formErrors.exit_time}</span>
                        </div>
                      )}

                    </div>



                    <div className="fullWidth">
                      <label>
                        Email
                        <span className="required">*</span>
                      </label>
                      <input
                        name="email"
                        className={`nicInput ${formErrors.email ? "error" : ""}`}
                        value={editGuestForm.email}
                        onChange={(e) =>
                          setEditGuestForm(s => ({ ...s, email: e.target.value }))
                        }
                        onKeyUp={() => validateSingleField(guestManagementSchema, "email", editGuestForm.email, setFormErrors)}
                      />
                      {/* <p className="errorText">{formErrors.email}</p> */}
                      {formErrors.email && (
                        <div className="fieldError">
                          <XCircle size={14} />
                          <span>{formErrors.email}</span>
                        </div>
                      )}

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