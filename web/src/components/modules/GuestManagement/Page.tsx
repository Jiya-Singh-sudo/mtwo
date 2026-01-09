import { useEffect, useState } from "react";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { getActiveGuests, createGuest, updateGuest, softDeleteGuest } from "@/api/guest.api";
import { createGuestDesignation, updateGuestDesignation } from "@/api/guestDesignation.api";
import { updateGuestInOut, softDeleteGuestInOut } from "@/api/guestInOut.api";
import { guestSchema } from "@/validation/guest.validation";
// import { designationSchema } from "@/validation/designation.validation";
import { guestInOutSchema } from "@/validation/guestInOut.validation";
import { useTableQuery } from "@/hooks/useTableQuery";
import { ZodError } from "zod";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { ActiveGuestRow } from "../../../types/guests";
import "./GuestManagementModals.css";
import { getActiveDesignationList } from "@/api/designation.api";
import { formatSeparate } from "@/utils/dateTime";

type DesignationOption = {
  designation_id: string;
  designation_name: string;
  organization?: string;
  office_location?: string;
  department?: string;
};

// Indian mobile number: 10 digits, starts with 6–9
const MOBILE_REGEX = /^[6-9]\d{9}$/;
export function GuestManagement() {
  const [guests, setGuests] = useState<ActiveGuestRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedGuest, setSelectedGuest] = useState<ActiveGuestRow | null>(null);
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [designationMode, setDesignationMode] = useState<"existing" | "other">("existing");

  const initialGuestForm = {
    guest_name: '',
    guest_name_local_language: '',
    mobile: '',
    alternate_mobile: '',
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
    exit_time: ''
  };
  // type SortOrder = 'asc' | 'desc';
  // type GuestTableQuery = {
  //   page: number;
  //   limit: number;
  //   search: string;
  //   status: string;
  //   sortBy: string;
  //   sortOrder: SortOrder;
  // };
  // const parseNumber = (value: string | null, fallback: number) =>
  //   value ? Number(value) || fallback : fallback;

  // const parseString = (value: string | null, fallback: string) =>
  //   value ?? fallback;
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
  const [guestForm, setGuestForm] = useState(initialGuestForm);
  const [editGuestForm, setEditGuestForm] = useState<any>(initialGuestForm);
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
    if (showAdd || showEdit || showView || showDeleteConfirm) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => document.body.classList.remove("modal-open");
  }, [showAdd, showEdit, showView, showDeleteConfirm]);

  useEffect(() => {
    if (!showAdd) return;

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
  }, [showAdd]);

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


  // CREATE flow: create guest -> create designation (if needed) -> create inout
  // In web/src/components/modules/GuestManagement/Page.tsx
  async function handleAddGuest() {
    setFormErrors({});
    console.log("Submitting", guestForm);

    const finalDesignationId =
      designationMode === "existing"
        ? guestForm.designation_id
        : undefined;
    try {
      /* ======================
        1. Guest validation
      ====================== */
      guestSchema.parse({
        guest_name: guestForm.guest_name,
        guest_mobile: guestForm.mobile,
        guest_name_local_language: guestForm.guest_name_local_language || undefined,
        guest_address: guestForm.guest_address || undefined,
        email: guestForm.email || undefined,
      });

      /* ======================
        2. Designation validation (conditional)
      ====================== */
      if (designationMode === "other") {
        if (!guestForm.designation_name) {
          throw new ZodError([
            {
              path: ["designation_name"],
              message: "Designation Name is required",
              code: "custom",
            },
          ]);
        }
      }

      /* ======================
        3. InOut validation (STRICT)
      ====================== */
      if (!guestForm.entry_date) {
        throw new ZodError([
          {
            path: ["entry_date"],
            message: "Check-in date is required",
            code: "custom",
          },
        ]);
      }

      // Ensure entry_time exists (auto-fill if user didn't touch it)
      const finalEntryTime =
        guestForm.entry_time
          ? `${guestForm.entry_time}:00`
          : new Date().toTimeString().slice(0, 8);


        guestInOutSchema.pick({
          entry_date: true,
          entry_time: true,
        }).parse({
          entry_date: guestForm.entry_date,
          entry_time: finalEntryTime,
        });

      // Cross-field rule
      // if (guestForm.exit_date && !guestForm.exit_time) {
      //   throw new ZodError([
      //     {
      //       path: ["exit_time"],
      //       message: "Exit time is required when exit date is provided",
      //       code: "custom",
      //     },
      //   ]);
      // }

      /* ======================
        4. API CALL
      ====================== */
      const payload = {
        guest: {
          guest_name: guestForm.guest_name,
          guest_name_local_language: guestForm.guest_name_local_language,
          guest_mobile: guestForm.mobile,
          guest_alternate_mobile: guestForm.alternate_mobile,
          guest_address: guestForm.guest_address,
          email: guestForm.email,
        },

        designation:
          designationMode === "existing"
            ? { designation_id: guestForm.designation_id }
            : {
                designation_name: guestForm.designation_name,
                department: guestForm.department,
                organization: guestForm.organization,
                office_location: guestForm.office_location,
              },

        inout: {
          entry_date: guestForm.entry_date,
          entry_time: guestForm.entry_time,
          exit_date: guestForm.exit_date,
          exit_time: guestForm.exit_time,
          status: "Entered",
          purpose: "Visit",
        },
      };

      await createGuest(payload);

      setShowAdd(false);
      setGuestForm(initialGuestForm);
      await loadGuests();

    } catch (err) {
      if (err instanceof ZodError) {
        console.log("ZOD VALIDATION FAILED:", err.issues);
        const errors: Record<string, string> = {};
        err.issues.forEach(issue => {
          errors[issue.path.join(".")] = issue.message;
        });
        setFormErrors(errors);
        return;
      }
      console.error("Create guest failed:", err);
      alert("Failed to add guest. Check browser console and server logs.");
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
      mobile: g.guest_mobile || "",
      alternate_mobile: g.guest_alternate_mobile || "",
      guest_address: g.guest_address || "",
      email: g.email || "",
      designation_id: g.designation_id || "",
      designation_name: g.designation_name || "",
      department: g.department || "",
      organization: g.organization || "",
      office_location: g.office_location || "",

      // FIX: Split ISO string to get YYYY-MM-DD
      entry_date: g.entry_date ? g.entry_date.toString().split('T')[0] : "",
      exit_date: g.exit_date ? g.exit_date.toString().split('T')[0] : "",

      status: g.inout_status || "Entered"
    });

    setEditGdId(g.gd_id || "");
    setEditInoutId(g.inout_id || "");

    setShowEdit(true);
  }

  async function submitEdit() {
    try {
      if (!selectedGuest) return;
      // update m_guest
      await updateGuest(selectedGuest.guest_id, {
        guest_name: editGuestForm.guest_name,
        guest_name_local_language: editGuestForm.guest_name_local_language,
        guest_mobile: editGuestForm.mobile,
        guest_alternate_mobile: editGuestForm.alternate_mobile,
        guest_address: editGuestForm.guest_address,
        email: editGuestForm.email
      });

      // update designation mapping (and m_designation name if changed)
      if (editGdId) {
        await updateGuestDesignation(editGdId, {
          designation_id: editGuestForm.designation_id,
          designation_name: editGuestForm.designation_name,
          department: editGuestForm.department,
          organization: editGuestForm.organization,
          office_location: editGuestForm.office_location
        });
      } else {
        // no gd row exists — create one
        await createGuestDesignation({
          guest_id: selectedGuest.guest_id,
          designation_id: editGuestForm.designation_id,
          designation_name: editGuestForm.designation_name,
          department: editGuestForm.department,
          organization: editGuestForm.organization,
          office_location: editGuestForm.office_location
        });
      }

      // update inout
      if (editInoutId) {
        await updateGuestInOut(editInoutId, {
          entry_date: editGuestForm.entry_date,
          entry_time: editGuestForm.entry_time,
          exit_date: editGuestForm.exit_date,
          exit_time: editGuestForm.exit_time,
          status: editGuestForm.status || 'Entered'
        });
      }

      setShowEdit(false);
      await loadGuests();
    } catch (err) {
      console.error('edit failed', err);
      alert('Failed to update guest');
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
    } catch (err) {
      console.error('delete failed', err);
      alert('Failed to delete entry');
    }
  }

  function validateSingleField(
    schema: any,
    field: string,
    value: any
  ) {
    try {
      schema.pick({ [field]: true }).parse({ [field]: value });
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    } catch (err) {
      if (err instanceof ZodError) {
        setFormErrors((prev) => ({
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
          onClick={() => { setShowAdd(true) }}
        >
          <Plus className="w-5 h-5" />
          Add New Guest
        </button>
      </div>

      {/* SEARCH PANEL */}
      <div className="bg-white border rounded-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
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

          <div>
            <label className="text-sm block mb-2">Status</label>
            <select
              className="border p-2 rounded w-full"
              value={query.status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>All</option>
              <option value="Entered">Checked In</option>
              <option value="Exited">Checked Out</option>
              <option value="Inside">Inside</option>
            </select>
          </div>
        </div>
      </div>


      {loading && (
        <div className="flex justify-center space-x-2 py-6">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-150"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-300"></div>
        </div>
      )}

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

      {/* EDIT GUEST */}
      {showEdit && selectedGuest && (
        <div className="modalOverlay">
          <div className="modal largeModal">
            <h3>Edit Guest</h3>

            {/* BASIC INFO */}
            <h4>Basic Information</h4>

            <label>Name</label>
            <input
              className="modalInput"
              value={editGuestForm.guest_name}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, guest_name: e.target.value })
              }
            />

            <label>Mobile</label>
            <input
              className="modalInput"
              value={editGuestForm.mobile}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, mobile: e.target.value })
              }
            />

            {/* DESIGNATION */}
            <h4>Designation</h4>

            {/* <label>Designation ID</label>
            <input
              className="modalInput"
              value={editGuestForm.designation_id}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, designation_id: e.target.value })
              }
            /> */}

            <label>Designation Name</label>
            <input
              className="modalInput"
              value={editGuestForm.designation_name}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, designation_name: e.target.value })
              }
            />

            <label>Organization</label>
            <input
              className="modalInput"
              value={editGuestForm.organization}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, organization: e.target.value })
              }
            />

            <label>Office Location</label>
            <input
              className="modalInput"
              value={editGuestForm.office_location}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, office_location: e.target.value })
              }
            />

            {/* IN/OUT */}
            <h4>Visit Details</h4>

            <label>Check-in Date</label>
            <input
              type="date"
              className="modalInput"
              value={editGuestForm.entry_date}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, entry_date: e.target.value })
              }
            />
            <label>Check-out Date</label>
            <input
              type="date"
              className="modalInput"
              value={editGuestForm.exit_date}
              onChange={(e) =>
                setEditGuestForm({ ...editGuestForm, exit_date: e.target.value })
              }
            />

            <label>Status</label>
            <select
              className="border p-2 rounded w-full"
              value={editGuestForm.status}
              onChange={(e) =>
                setEditGuestForm({
                  ...editGuestForm,
                  status: e.target.value,
                })
              }
            >
              <option value="Entered">Checked In</option>
              <option value="Exited">Checked Out</option>
              <option value="Inside">Inside</option>
            </select>

            {/* ACTIONS */}
            <div className="modalActions">
              <button onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="saveBtn" onClick={submitEdit}>
                Save Changes
              </button>
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
      )}


      {/* ADD GUEST MODAL */}
      {showAdd && (
        <div className="modalOverlay">
          <div className="modal largeModal">
            <h3>Add Guest</h3>
            <div className="modalBody">
              <div>

                {/* 2-COLUMN FORM GRID */}
                <div className="nicFormGrid">
                  <div>
                    <label>Full Name *</label>
                    <input
                      className={`nicInput ${formErrors.guest_name ? "error" : ""}`}
                      value={guestForm.guest_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setGuestForm(s => ({ ...s, guest_name: value }));
                        validateSingleField(guestSchema, "guest_name", value);
                      }}
                    />
                    <p className="errorText">{formErrors.guest_name}</p>
                  </div>

                  <div>
                    <label>Name (Local Language)</label>
                    <input className="nicInput" value={guestForm.guest_name_local_language} onChange={(e) => setGuestForm(s => ({ ...s, guest_name_local_language: e.target.value }))} />
                  </div>

                  <div className="fullWidth">
                    <label>Designation *</label>
                    <select
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
                    >
                      <option value="">Select designation</option>

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
                        />
                      </div>

                      <div>
                        <label>Office Location *</label>
                        <input
                          className="nicInput"
                          value={guestForm.office_location}
                          onChange={(e) =>
                            setGuestForm(s => ({ ...s, office_location: e.target.value }))
                          }
                        />
                      </div>
                    </>
                  )}
                  {/* <div>
                    <label>Designation Id</label>
                    <input className="nicInput" value={guestForm.designation_id} onChange={(e) => setGuestForm(s => ({ ...s, designation_id: e.target.value }))} />
                  </div>

                  <div>
                    <label>Designation Name</label>
                    <input className="nicInput" value={guestForm.designation_name} onChange={(e) => setGuestForm(s => ({ ...s, designation_name: e.target.value }))} />
                  </div>

                  <div>
                    <label>Organization</label>
                    <input className="nicInput" value={guestForm.organization} onChange={(e) => setGuestForm(s => ({ ...s, organization: e.target.value }))} />
                  </div>

                  <div>
                    <label>Office Location</label>
                    <input className="nicInput" value={guestForm.office_location} onChange={(e) => setGuestForm(s => ({ ...s, office_location: e.target.value }))} />
                  </div> */}

                  <div>
                    <label>Mobile Number *</label>
                    <input
                      className={`nicInput ${formErrors.mobile ? "error" : ""}`}
                      placeholder="10-digit mobile number"
                      value={guestForm.mobile}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setGuestForm(s => ({ ...s, mobile: value }));

                        if (!MOBILE_REGEX.test(value)) {
                          setFormErrors(prev => ({
                            ...prev,
                            mobile: "Mobile number must be 10 digits and start with 6–9",
                          }));
                        } else {
                          setFormErrors(prev => {
                            const copy = { ...prev };
                            delete copy.mobile;
                            return copy;
                          });
                        }
                      }}
                    />
                    <p className="errorText">{formErrors.mobile}</p>
                    <p className="errorText">{formErrors.guest_mobile}</p>
                  </div>

                  <div>
                    <label>Alternate Mobile</label>
                    <input className="nicInput" value={guestForm.alternate_mobile} onChange={(e) => setGuestForm(s => ({ ...s, alternate_mobile: e.target.value }))} />
                  </div>

                  {/* Full width field */}
                  <div className="fullWidth">
                    <label>Address</label>
                    <textarea className="nicInput" value={guestForm.guest_address} onChange={(e) => setGuestForm(s => ({ ...s, guest_address: e.target.value }))} />
                  </div>

                  {/* Check-in Date */}
                  <div>
                    <label>Check-in Date</label>
                    <input
                      type="date"
                      className={`nicInput ${formErrors.entry_date ? "error" : ""}`}
                      value={guestForm.entry_date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setGuestForm(s => ({ ...s, entry_date: value }));
                        validateSingleField(guestInOutSchema, "entry_date", value);
                      }}
                    />
                    <p className="errorText">{formErrors.entry_date}</p>
                  </div>

                  <div>
                    <label>Check-in Time *</label>
                    <input
                      type="time"
                      className={`nicInput ${formErrors.entry_time ? "error" : ""}`}
                      value={guestForm.entry_time}
                      onChange={(e) =>
                        setGuestForm(s => ({ ...s, entry_time: e.target.value }))
                      }
                    />
                    <p className="errorText">{formErrors.entry_time}</p>
                  </div>

                  {/* Check-out Date */}
                  <div>
                    <label>Check-out Date</label>
                    <input
                      type="date"
                      className="nicInput"
                      value={guestForm.exit_date}
                      onChange={(e) =>
                        setGuestForm((s) => ({ ...s, exit_date: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label>Check-out Time *</label>
                    <input
                      type="time"
                      className={`nicInput ${formErrors.exit_time ? "error" : ""}`}
                      value={guestForm.exit_time}
                      onChange={(e) =>
                        setGuestForm(s => ({ ...s, exit_time: e.target.value }))
                      }
                    />
                    <p className="errorText">{formErrors.exit_time}</p>
                  </div>

                  <div className="fullWidth">
                    <label>Email</label>
                    <input className="nicInput" value={guestForm.email} onChange={(e) => setGuestForm(s => ({ ...s, email: e.target.value }))} />
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="nicModalActions">
                  <button className="cancelBtn" onClick={() => setShowAdd(false)}>
                    Cancel
                  </button>
                  <button className="saveBtn" onClick={handleAddGuest}>
                    Add Guest
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            />
            <p className="errorText">{formErrors.designation_name}</p>
          </div>

          <div>
            <label>Designation ID *</label>
            <input
              className={`nicInput ${formErrors.designation_id ? "error" : ""}`}
              value={guestForm.designation_id}
              onChange={(e) =>
                setGuestForm(s => ({ ...s, designation_id: e.target.value }))
              }
            />
          </div>

          <div>
            <label>Organization *</label>
            <input
              className="nicInput"
              value={guestForm.organization}
              onChange={(e) =>
                setGuestForm(s => ({ ...s, organization: e.target.value }))
              }
            />
          </div>

          <div>
            <label>Office Location *</label>
            <input
              className="nicInput"
              value={guestForm.office_location}
              onChange={(e) =>
                setGuestForm(s => ({ ...s, office_location: e.target.value }))
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
export default GuestManagement;