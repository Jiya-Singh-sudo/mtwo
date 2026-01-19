import { useEffect, useState } from "react";
import { UtensilsCrossed, Users, CheckCircle, AlertCircle, Eye, FileEdit, Trash2, Plus, Search, Pencil, AlertTriangle, XCircle } from "lucide-react";
import "./FoodService.css";
import { getFoodDashboard } from "@/api/guestFood.api";
import { getActiveGuests } from "@/api/guest.api";
import { FoodDashboard } from "../../../types/guestFood";
import { ActiveGuestRow } from "@/types/guests";
import { createButler, updateButler, softDeleteButler, getButlerTable } from "@/api/butler.api";
import { createGuestButler, softDeleteGuestButler } from "@/api/guestButler.api";
import { useTableQuery } from "@/hooks/useTableQuery";
import { Butler } from "@/types/butler";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { butlerManagementSchema } from "@/validation/butler.validation";
// import { guestButlerSchema } from "@/validation/guestButler.validation";
// import { guestFoodSchema } from "@/validation/guestFood.validation";
// import { mealManagementSchema } from "@/validation/meals.validation";
import { validateSingleField } from "@/utils/validateSingleField";

/* ---------------- TYPES ---------------- */
type ButlerMode = "add" | "view" | "edit";

type DailyMealPlan = {
  breakfast: string[];
  lunch: string[];
  highTea: string[];
  dinner: string[];
};

type GuestWithButler = ActiveGuestRow & {
  butler?: {
    id: string;
    name: string;
    guestButlerId?: string;
  };
  foodStatus?: "Served" | "Not Served";
  specialRequest?: string;
};

export function FoodService() {
  const butlerTable = useTableQuery({
    sortBy: "butler_name",
    sortOrder: "asc",
  });

  /* ---------------- TAB STATE ---------------- */
  const [activeTab, setActiveTab] =
    useState<"butler" | "food">("food");

  /* ---------------- FOOD SERVICE STATE ---------------- */
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<FoodDashboard | null>(null);
  const [guests, setGuests] = useState<GuestWithButler[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statsFilter, setStatsFilter] = useState<"ALL" | "SERVED" | "SPECIAL" | "MENU">("ALL");


  /* ---------------- DAILY MEAL PLAN (UI-ONLY, ONE FOR ALL GUESTS) ---------------- */
  const [dailyPlan, setDailyPlan] = useState<DailyMealPlan>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem("dailyMealPlan");
    return saved
      ? JSON.parse(saved)
      : { breakfast: [], lunch: [], highTea: [], dinner: [] };
  });

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<keyof DailyMealPlan>("breakfast");
  const [menuInput, setMenuInput] = useState("");
  const [menuMode, setMenuMode] = useState<"create" | "edit">("create");
  const [activeGuestForEdit, setActiveGuestForEdit] = useState<GuestWithButler | null>(null);


  /* ---------------- SPECIAL REQUEST MODAL STATE ---------------- */
  const [specialReqModalOpen, setSpecialReqModalOpen] = useState(false);
  const [specialReqText, setSpecialReqText] = useState("");
  const [activeGuestForRequest, setActiveGuestForRequest] = useState<GuestWithButler | null>(null);


  /* ---------------- BUTLER MANAGEMENT STATE ---------------- */
  const [butlers, setButlers] = useState<Butler[]>([]);

  const [butlerModalOpen, setButlerModalOpen] = useState(false);
  const [butlerMode, setButlerMode] = useState<ButlerMode>("add");
  const [activeButler, setActiveButler] = useState<Butler | null>(null);
  const [deleteButler, setDeleteButler] = useState<Butler | null>(null);


  const [butlerForm, setButlerForm] = useState({
    butler_name: "",
    butler_name_local_language: "",
    butler_mobile: "",
    butler_alternate_mobile: "",
    shift: "",
    address: "",
    remarks: "",
  });

  /* ---------------- LOADERS ---------------- */
  async function loadFoodData() {
    try {
      const dashboard = await getFoodDashboard();
      setStats(dashboard);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadGuests() {
    try {
      // Fetch ALL active guests (not food orders)
      const res = await getActiveGuests({
        page: 1,
        limit: 1000, // Get all for now
        status: "Entered", // Only guests who have entered
      });

      // Map to our type with optional butler info
      const guestsWithButler: GuestWithButler[] = res.data.map((g: ActiveGuestRow) => ({
        ...g,
        butler: undefined,
        foodStatus: "Not Served" as const,
        specialRequest: "",
      }));

      setGuests(guestsWithButler);
    } catch (err) {
      console.error("Failed to load guests", err);
    }
  }

  async function loadButlers() {
    butlerTable.setLoading(true);
    try {
      const res = await getButlerTable({
        page: butlerTable.query.page,
        limit: butlerTable.query.limit,
        search: butlerTable.query.search,
        sortBy: butlerTable.query.sortBy,
        sortOrder: butlerTable.query.sortOrder,
        status: butlerTable.query.status,
      });

      setButlers(res.data);
      butlerTable.setTotal(res.totalCount);
    } catch (err) {
      console.error("Failed to load butlers", err);
    } finally {
      butlerTable.setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "butler") {
      loadButlers();
    }
  }, [butlerTable.query, activeTab]);

  useEffect(() => {
    loadFoodData();
    loadButlers();
    loadGuests(); // Now loading from getActiveGuests!
  }, []);

  // Persist dailyPlan to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("dailyMealPlan", JSON.stringify(dailyPlan));
  }, [dailyPlan]);

  /* ---------------- GUEST FILTERING ---------------- */
  const hasMealPlan = Object.values(dailyPlan).some((items) => items.length > 0);

  const filteredGuests = guests.filter((g) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !g.guest_name.toLowerCase().includes(q) &&
        !String(g.room_id ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    // Stats filter
    switch (statsFilter) {
      case "SERVED":
        return g.foodStatus === "Served";
      case "SPECIAL":
        return Boolean(g.specialRequest && g.specialRequest.trim());
      case "MENU":
        return hasMealPlan; // Show all guests if menu exists
      case "ALL":
      default:
        return true;
    }
  });



  /* ---------------- BUTLER ASSIGNMENT ---------------- */
  async function handleAssignButler(guestId: string, roomId: string | null | undefined, butlerId: string) {
    try {
      await createGuestButler({
        guest_id: guestId,
        room_id: roomId ?? undefined,
        butler_id: butlerId,
        // service_type: "Food",
        // service_date: new Date().toISOString().split("T")[0],
      });

      // Find the butler name
      const butler = butlers.find(b => b.butler_id === butlerId);

      // Update local state to show butler immediately
      setGuests(prev => prev.map(g =>
        g.guest_id === guestId
          ? {
            ...g,
            butler: butler ? {
              id: butler.butler_id,
              name: butler.butler_name,
              guestButlerId: undefined, // Will be set on reload
            } : undefined
          }
          : g
      ));

      // Don't reload guests - backend doesn't return butler info with getActiveGuests
      // Local state update above is sufficient
    } catch (err) {
      console.error("Failed to assign butler", err);
      alert("Failed to assign butler");
    }
  }

  async function handleUnassignButler(guestButlerId: string) {
    if (!confirm("Unassign this butler from the guest?")) return;
    try {
      await softDeleteGuestButler(guestButlerId);
      await loadGuests();
    } catch (err) {
      console.error("Failed to unassign butler", err);
      alert("Failed to unassign butler");
    }
  }

  /* ---------------- DAILY MEAL PLANNING (UI-ONLY) ---------------- */
  function handleAddMenuItem() {
    if (!menuInput.trim()) return;

    setDailyPlan((prev) => ({
      ...prev,
      [selectedMeal]: [...prev[selectedMeal], menuInput.trim()],
    }));

    setMenuInput("");
  }

  function handleRemoveMenuItem(meal: keyof DailyMealPlan, index: number) {
    setDailyPlan((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((_, i) => i !== index),
    }));
  }

  /* ---------------- GUEST CARD ACTIONS ---------------- */
  function handleToggleFoodStatus(guestId: string, status: "Served" | "Not Served") {
    setGuests((prev) =>
      prev.map((g) =>
        g.guest_id === guestId ? { ...g, foodStatus: status } : g
      )
    );
  }

  function handleDeleteGuestPlan(guestId: string) {
    if (!confirm("Clear today's meal plan for this guest?")) return;
    // UI-only for now - can be wired to backend later
    console.log("Clear plan for guest:", guestId);
  }

  function handleEditMenu(guest: GuestWithButler) {
    setMenuMode("edit");
    setActiveGuestForEdit(guest);
    setSelectedMeal("breakfast");
    setMenuInput("");
    setMenuModalOpen(true);
  }

  function handleSpecialRequest(guest: GuestWithButler) {
    setActiveGuestForRequest(guest);
    setSpecialReqText(guest.specialRequest ?? "");
    setSpecialReqModalOpen(true);
  }

  function saveSpecialRequest() {
    if (!activeGuestForRequest) return;

    setGuests((prev) =>
      prev.map((g) =>
        g.guest_id === activeGuestForRequest.guest_id
          ? { ...g, specialRequest: specialReqText }
          : g
      )
    );

    setSpecialReqModalOpen(false);
    setActiveGuestForRequest(null);
    setSpecialReqText("");
  }

  /* ---------------- DERIVED STATS (LIVE FROM UI STATE) ---------------- */
  const servedCount = guests.filter((g) => g.foodStatus === "Served").length;
  const specialRequestCount = guests.filter(
    (g) => g.specialRequest && g.specialRequest.trim()
  ).length;

  const mealLabels: Record<keyof DailyMealPlan, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    highTea: "High Tea",
    dinner: "Dinner",
  };

  /* ---------------- BUTLER MODAL ACTIONS ---------------- */
  function openAddButler() {
    setButlerMode("add");
    setActiveButler(null);
    setButlerForm({
      butler_name: "",
      butler_name_local_language: "",
      butler_mobile: "",
      butler_alternate_mobile: "",
      shift: "",
      address: "",
      remarks: "",
    });
    setButlerModalOpen(true);
  }

  function openViewButler(butler: Butler) {
    setButlerMode("view");
    setActiveButler(butler);
    setButlerForm({
      butler_name: butler.butler_name,
      butler_name_local_language: butler.butler_name_local_language ?? "",
      butler_mobile: String(butler.butler_mobile ?? ""),
      butler_alternate_mobile: butler.butler_alternate_mobile
        ? String(butler.butler_alternate_mobile)
        : "",
      shift: butler.shift,
      address: butler.address ?? "",
      remarks: butler.remarks ?? "",
    });
    setButlerModalOpen(true);
  }

  function openEditButler(butler: Butler) {
    setButlerMode("edit");
    setActiveButler(butler);
    setButlerForm({
      butler_name: butler.butler_name,
      butler_name_local_language: butler.butler_name_local_language ?? "",
      butler_mobile: String(butler.butler_mobile ?? ""),
      butler_alternate_mobile: butler.butler_alternate_mobile
        ? String(butler.butler_alternate_mobile)
        : "",
      shift: butler.shift,
      address: butler.address ?? "",
      remarks: butler.remarks ?? "",
    });
    setButlerModalOpen(true);
  }

  async function removeButler(butler: Butler) {
    if (!confirm(`Deactivate ${butler.butler_name}?`)) return;

    try {
      await softDeleteButler(butler.butler_id);
      loadButlers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete butler");
    }
  }

  async function saveButler() {
    if (!butlerForm.shift) {
      alert("Please select shift");
      return;
    }

    if (!/^\d+$/.test(butlerForm.butler_mobile)) {
      alert("Mobile number must be numeric");
      return;
    }

    try {
      const payload = {
        butler_name: butlerForm.butler_name,
        butler_name_local_language:
          butlerForm.butler_name_local_language || undefined,

        butler_mobile: Number(butlerForm.butler_mobile),
        butler_alternate_mobile: butlerForm.butler_alternate_mobile
          ? Number(butlerForm.butler_alternate_mobile)
          : undefined,

        shift: butlerForm.shift as
          | "Morning"
          | "Evening"
          | "Night"
          | "Full-Day",

        address: butlerForm.address || undefined,
        remarks: butlerForm.remarks || undefined,
      };

      if (butlerMode === "add") {
        await createButler(payload);
      }

      if (butlerMode === "edit" && activeButler) {
        await updateButler(activeButler.butler_id, payload);
      }

      setButlerModalOpen(false);
      loadButlers();
    } catch (err) {
      console.error(err);
      alert("Failed to save butler");
    }
  }

  /* ---------------- GUEST FOOD CARD COMPONENT ---------------- */
  type GuestFoodCardProps = {
    guest: GuestWithButler;
    butlersList: Butler[];
    dailyMealPlan: DailyMealPlan;
    onAssignButler: (guestId: string, roomId: string | null | undefined, butlerId: string) => void;
    onUnassignButler: (guestButlerId: string) => void;
    onToggleFoodStatus: (guestId: string, status: "Served" | "Not Served") => void;
    onDeleteGuestPlan: (guestId: string) => void;
    onSpecialRequest: (guest: GuestWithButler) => void;
    onEditMenu: (guest: GuestWithButler) => void;
  };

  function GuestFoodCard({
    guest,
    butlersList,
    dailyMealPlan,
    onAssignButler,
    onUnassignButler,
    onToggleFoodStatus,
    onDeleteGuestPlan,
    onSpecialRequest,
    onEditMenu,
  }: GuestFoodCardProps) {
    const hasMealPlan = Object.values(dailyMealPlan).some((items) => items.length > 0);

    return (
      <div className="guestFoodCard">
        {/* Header with Actions */}
        <div className="cardHeader">
          <div>
            <h4 className="guestName">{guest.guest_name}</h4>
            <div className="guestBadges">
              <span className="roomBadge">
                {guest.room_id ? `Room ${guest.room_id}` : "No Room"}
              </span>
              {guest.specialRequest && (
                <span className="specialReqBadge" title={guest.specialRequest}>
                  Special
                </span>
              )}
            </div>
          </div>

          {/* Actions bar */}
          <div className="cardActions">
            <span className={`foodStatusBadge ${guest.foodStatus === "Served" ? "served" : ""}`}>
              {guest.foodStatus}
            </span>

            <div className="iconActions">
              {/* Edit */}
              <button
                className="iconBtn"
                title="Edit meal / butler"
                onClick={() => onEditMenu(guest)}
              >
                <Pencil size={14} />
              </button>

              {/* Special Request */}
              <button
                className={`iconBtn warning ${guest.specialRequest ? "active" : ""}`}
                title={guest.specialRequest || "Add special request"}
                onClick={() => onSpecialRequest(guest)}
              >
                <AlertTriangle size={14} />
              </button>

              {/* Served / Not Served Toggle */}
              {guest.foodStatus === "Served" ? (
                <button
                  className="iconBtn danger"
                  title="Mark not served"
                  onClick={() => onToggleFoodStatus(guest.guest_id, "Not Served")}
                >
                  <XCircle size={14} />
                </button>
              ) : (
                <button
                  className="iconBtn success"
                  title="Mark served"
                  onClick={() => onToggleFoodStatus(guest.guest_id, "Served")}
                >
                  <CheckCircle size={14} />
                </button>
              )}

              {/* Delete */}
              <button
                className="iconBtn danger"
                title="Clear today's plan"
                onClick={() => onDeleteGuestPlan(guest.guest_id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Guest Info */}
        {guest.designation_name && (
          <div className="guestMeta">
            <span>{guest.designation_name}</span>
            {guest.organization && <span> • {guest.organization}</span>}
          </div>
        )}

        {/* Today's Meal Plan (READ-ONLY from daily plan) */}
        <div className="menuSection">
          <div className="sectionHeader">
            <strong>Today's Meal Plan</strong>
          </div>
          {!hasMealPlan ? (
            <p className="emptyText">No meals planned for today</p>
          ) : (
            <div className="mealPlanList">
              {(Object.entries(dailyMealPlan) as [keyof DailyMealPlan, string[]][]).map(
                ([meal, items]) =>
                  items.length > 0 && (
                    <div key={meal} className="mealGroup">
                      <span className="mealLabel">{mealLabels[meal]}</span>
                      <ul className="menuList">
                        {items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          )}
        </div>

        {/* Butler Assignment */}
        <div className="butlerSection">
          <strong>Butler</strong>
          {guest.butler ? (
            <div className="assignedButler">
              <span>{guest.butler.name}</span>
              {guest.butler.guestButlerId ? (
                <button
                  className="unassignBtn"
                  onClick={() => onUnassignButler(guest.butler!.guestButlerId!)}
                >
                  Unassign
                </button>
              ) : (
                <span className="assignedLabel">Assigned</span>
              )}
            </div>
          ) : (
            <select
              className="nicInput butlerSelect"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onAssignButler(guest.guest_id, guest.room_id, e.target.value);
                  e.target.value = "";
                }
              }}
            >
              <option value="">Assign Butler</option>
              {butlersList.map((b) => (
                <option key={b.butler_id} value={b.butler_id}>
                  {b.butler_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  const butlerColumns: Column<Butler>[] = [
    {
      header: "Butler ID",
      accessor: "butler_id",
      sortable: true,
      sortKey: "butler_id",
    },
    {
      header: "Name",
      accessor: "butler_name",
      sortable: true,
      sortKey: "butler_name",
    },
    {
      header: "Shift",
      accessor: "shift",
      sortable: true,
      sortKey: "shift",
    },
    {
      header: "Status",
      sortable: true,
      sortKey: "is_active",
      render: (b) => (
        <span className={`statusPill ${b.is_active ? "active" : "inactive"}`}>
          {b.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (b) => (
        <div className="actionCell">
          <button className="iconBtn view" title="View" onClick={() => openViewButler(b as Butler)}>
            <Eye size={16} />
          </button>
          <button className="iconBtn edit" title="Edit" onClick={() => openEditButler(b as Butler)}>
            <FileEdit size={16} />
          </button>
          <button className="iconBtn delete" title="Delete" onClick={() => setDeleteButler(b as Butler)}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  /* ---------------- RENDER ---------------- */
  return (
    <div className="foodServicePage">
      {/* HEADER */}
      <div className="headerRow">
        <div>
          <h2>Food Service</h2>
          <p>खाद्य सेवा – Guest Food Planning & Butler Management</p>
        </div>
      </div>

      {/* STATS - Clickable filters */}
      <div className="statsGrid">
        <div
          className={`statCard blue ${statsFilter === "ALL" ? "active" : ""}`}
          onClick={() => setStatsFilter("ALL")}
        >
          <Users />
          <div>
            <p>Active Guests</p>
            <h3>{guests.length}</h3>
          </div>
        </div>

        <div
          className={`statCard green ${statsFilter === "SERVED" ? "active" : ""}`}
          onClick={() => setStatsFilter("SERVED")}
        >
          <CheckCircle />
          <div>
            <p>Meals Served</p>
            <h3>{servedCount}</h3>
          </div>
        </div>

        <div
          className={`statCard orange ${statsFilter === "SPECIAL" ? "active" : ""}`}
          onClick={() => setStatsFilter("SPECIAL")}
        >
          <AlertCircle />
          <div>
            <p>Special Requests</p>
            <h3>{specialRequestCount}</h3>
          </div>
        </div>

        <div
          className={`statCard purple ${statsFilter === "MENU" ? "active" : ""}`}
          onClick={() => setStatsFilter("MENU")}
        >
          <UtensilsCrossed />
          <div>
            <p>Menu Items</p>
            <h3>{
              Object.values(dailyPlan).reduce((sum, items) => sum + items.length, 0)
            }</h3>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="nicTabs">
        <button
          className={`nicTab ${activeTab === "food" ? "active" : ""}`}
          onClick={() => setActiveTab("food")}
        >
          Guest Food Planning
        </button>

        <button
          className={`nicTab ${activeTab === "butler" ? "active" : ""}`}
          onClick={() => setActiveTab("butler")}
        >
          Butler Management
        </button>
      </div>

      {/* ---------------- GUEST FOOD PLANNING TAB ---------------- */}
      {activeTab === "food" && (
        <div className="bg-white border rounded-sm p-6">
          {/* HEADER: Search + Plan Menu */}
          <div className="planMenuHeader">
            <div className="searchWrapper">
              <Search size={18} className="searchIcon" />
              <input
                className="nicInput searchInput"
                placeholder="Search guest / room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="nicPrimaryBtn"
              onClick={() => {
                setMenuMode("create");
                setActiveGuestForEdit(null);
                setSelectedMeal("breakfast");
                setMenuInput("");
                setMenuModalOpen(true);
              }}
            >
              <Plus size={16} /> Plan Menu
            </button>
          </div>

          {/* TODAY'S MEAL PLAN SUMMARY (optional quick view) */}
          {Object.values(dailyPlan).some((items) => items.length > 0) && (
            <div className="dailyPlanSummary">
              <h4>Today's Planned Menu</h4>
              <div className="mealSummaryGrid">
                {(Object.entries(dailyPlan) as [keyof DailyMealPlan, string[]][]).map(
                  ([meal, items]) => (
                    <div key={meal} className="mealSummaryCard">
                      <span className="mealLabel">{mealLabels[meal]}</span>
                      {items.length === 0 ? (
                        <span className="emptyText">Not planned</span>
                      ) : (
                        <ul className="menuList">
                          {items.map((item, i) => (
                            <li key={i}>
                              {item}
                              <button
                                className="removeItemBtn"
                                onClick={() => handleRemoveMenuItem(meal, i)}
                                title="Remove"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* GUEST GRID */}
          {filteredGuests.length === 0 ? (
            <div className="emptyState">
              <UtensilsCrossed size={32} />
              <p>No active guests found</p>
              <span className="emptyText">
                Guests will appear here when they check in
              </span>
            </div>
          ) : (
            <div className="guestFoodGrid">
              {filteredGuests.map((g) => (
                <GuestFoodCard
                  key={g.guest_id}
                  guest={g}
                  butlersList={butlers}
                  dailyMealPlan={dailyPlan}
                  onAssignButler={handleAssignButler}
                  onUnassignButler={handleUnassignButler}
                  onToggleFoodStatus={handleToggleFoodStatus}
                  onDeleteGuestPlan={handleDeleteGuestPlan}
                  onSpecialRequest={handleSpecialRequest}
                  onEditMenu={handleEditMenu}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- BUTLER MANAGEMENT TAB ---------------- */}
      {activeTab === "butler" && (
        <div className="bg-white border rounded-sm p-6">
          <div className="tableHeader">
            <h3 className="sectionTitle">Butler Management</h3>

            <button className="nicPrimaryBtn" onClick={openAddButler}>
              <Plus size={16} /> Add Butler
            </button>
          </div>
          <DataTable
            data={butlers}
            columns={butlerColumns}
            keyField="butler_id"
            page={butlerTable.query.page}
            limit={butlerTable.query.limit}
            totalCount={butlerTable.total}
            sortBy={butlerTable.query.sortBy}
            sortOrder={butlerTable.query.sortOrder}
            loading={butlerTable.loading}
            onPageChange={butlerTable.setPage}
            onLimitChange={butlerTable.setLimit}
            onSortChange={butlerTable.setSort}
          />
        </div>
      )}

      {/* ---------------- BUTLER MODAL ---------------- */}
      {butlerModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>
                {butlerMode === "add" && "Add Butler"}
                {butlerMode === "view" && "View Butler"}
                {butlerMode === "edit" && "Edit Butler"}
              </h2>
              <button onClick={() => setButlerModalOpen(false)}>✕</button>
            </div>

            {/* VIEW MODE - Read-only card layout */}
            {butlerMode === "view" && activeButler && (
              <div className="viewGrid">
                <div className="viewCard">
                  <h4>Butler Information</h4>
                  <p><strong>Name:</strong> {activeButler.butler_name}</p>
                  <p><strong>Local Name:</strong> {activeButler.butler_name_local_language || "—"}</p>
                  <p><strong>Mobile:</strong> {activeButler.butler_mobile}</p>
                  <p><strong>Alternate:</strong> {activeButler.butler_alternate_mobile || "—"}</p>
                </div>

                <div className="viewCard">
                  <h4>Work Details</h4>
                  <p><strong>Shift:</strong> {activeButler.shift}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`statusPill ${activeButler.is_active ? "active" : "inactive"}`}>
                      {activeButler.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>

                <div className="viewCard full">
                  <h4>Other</h4>
                  <p><strong>Address:</strong> {activeButler.address || "—"}</p>
                  <p><strong>Remarks:</strong> {activeButler.remarks || "—"}</p>
                </div>
              </div>
            )}

            {/* ADD/EDIT MODE - Form layout */}
            {butlerMode !== "view" && (
              <div className="nicFormGrid">
                <div>
                  <label>Butler Name <span className="required">*</span></label>
                  <input
                    className="nicInput"
                    value={butlerForm.butler_name}
                    onChange={(e) =>
                      setButlerForm({ ...butlerForm, butler_name: e.target.value })
                    }
                    onBlur={(e) => validateSingleField(butlerManagementSchema, "butler_name", e.currentTarget.value, setFormErrors)}
                    onKeyUp={(e) => validateSingleField(butlerManagementSchema, "butler_name", e.currentTarget.value, setFormErrors)}
                  />
                </div>

                {/* <div>
                  <label>Local Language Name</label>
                  <input
                    className="nicInput"
                    value={butlerForm.butler_name_local_language}
                    onChange={(e) =>
                      setButlerForm({
                        ...butlerForm,
                        butler_name_local_language: e.target.value,
                      })
                    }
                  />
                </div> */}

                <div>
                  <label>Mobile <span className="required">*</span></label>
                  <input
                    className="nicInput"
                    value={butlerForm.butler_mobile}
                    onChange={(e) =>
                      setButlerForm({ ...butlerForm, butler_mobile: e.target.value })
                    }
                    onBlur={(e) => validateSingleField(butlerManagementSchema, "butler_mobile", e.currentTarget.value, setFormErrors)}
                    onKeyUp={(e) => validateSingleField(butlerManagementSchema, "butler_mobile", e.currentTarget.value, setFormErrors)}
                  />
                </div>

                <div>
                  <label>Alternate Mobile</label>
                  <input
                    className="nicInput"
                    value={butlerForm.butler_alternate_mobile}
                    onChange={(e) =>
                      setButlerForm({
                        ...butlerForm,
                        butler_alternate_mobile: e.target.value,
                      })
                    }
                    onBlur={(e) => validateSingleField(butlerManagementSchema, "butler_alternate_mobile", e.currentTarget.value, setFormErrors)}
                    onKeyUp={(e) => validateSingleField(butlerManagementSchema, "butler_alternate_mobile", e.currentTarget.value, setFormErrors)}
                  />
                </div>

                <div>
                  <label>Shift <span className="required">*</span></label>
                  <select
                    className="nicInput"
                    value={butlerForm.shift}
                    onChange={(e) =>
                      setButlerForm({
                        ...butlerForm,
                        shift: e.target.value,
                      })
                    }
                    onBlur={(e) => validateSingleField(butlerManagementSchema, "shift", e.currentTarget.value, setFormErrors)}
                    onKeyUp={(e) => validateSingleField(butlerManagementSchema, "shift", e.currentTarget.value, setFormErrors)}
                  >
                    <option value="">Select</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Full-Day">Full-Day</option>
                  </select>
                </div>

                <div className="fullWidth">
                  <label>Address</label>
                  <textarea
                    className="nicInput"
                    rows={2}
                    value={butlerForm.address}
                    onChange={(e) =>
                      setButlerForm({ ...butlerForm, address: e.target.value })
                    }
                    onBlur={(e) => validateSingleField(butlerManagementSchema, "address", e.currentTarget.value, setFormErrors)}
                    onKeyUp={(e) => validateSingleField(butlerManagementSchema, "address", e.currentTarget.value, setFormErrors)}
                  />
                </div>

                <div className="fullWidth">
                  <label>Remarks</label>
                  <textarea
                    className="nicInput"
                    rows={2}
                    value={butlerForm.remarks}
                    onChange={(e) =>
                      setButlerForm({ ...butlerForm, remarks: e.target.value })
                    }
                    onBlur={(e) => validateSingleField(butlerManagementSchema, "remarks", e.currentTarget.value, setFormErrors)}
                    onKeyUp={(e) => validateSingleField(butlerManagementSchema, "remarks", e.currentTarget.value, setFormErrors)}
                  />
                </div>
              </div>
            )}

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setButlerModalOpen(false)}>
                {butlerMode === "view" ? "Close" : "Cancel"}
              </button>

              {butlerMode !== "view" && (
                <button className="saveBtn" onClick={saveButler}>
                  {butlerMode === "add" ? "Add Butler" : "Save Changes"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DELETE BUTLER MODAL ---------------- */}
      {deleteButler && (
        <div className="modalOverlay">
          <div className="nicModal small">
            <div className="nicModalHeader">
              <h2>Delete Butler</h2>
              <button onClick={() => setDeleteButler(null)}>✕</button>
            </div>

            <div className="modalBody">
              <p>
                Are you sure you want to delete{" "}
                <strong>{deleteButler.butler_name}</strong>?
              </p>
              <p className="dangerText">
                This action will deactivate the butler from the system.
              </p>
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setDeleteButler(null)}
              >
                Cancel
              </button>
              <button
                className="deleteBtn"
                onClick={async () => {
                  try {
                    await softDeleteButler(deleteButler.butler_id);
                    setDeleteButler(null);
                    // removeButler();
                    loadButlers();
                  } catch (err) {
                    console.error(err);
                    alert("Failed to delete butler");
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PLAN MENU MODAL (DAY-LEVEL) ---------------- */}
      {menuModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal wide">
            <div className="nicModalHeader">
              <h2>{menuMode === "create" ? "Plan Today's Menu" : "Edit Menu & Butler"}</h2>
              <button onClick={() => setMenuModalOpen(false)}>✕</button>
            </div>

            {/* Guest info in edit mode */}
            {menuMode === "edit" && activeGuestForEdit && (
              <div className="modalGuestInfo">
                <strong>{activeGuestForEdit.guest_name}</strong>
                <span> • Room {activeGuestForEdit.room_id ?? "N/A"}</span>
              </div>
            )}

            <div className="nicFormGrid">
              {/* Butler selector in edit mode */}
              {menuMode === "edit" && activeGuestForEdit && (
                <div className="fullWidth">
                  <label>Assigned Butler</label>
                  <select
                    className="nicInput"
                    value={activeGuestForEdit.butler?.id ?? ""}
                    onChange={(e) => {
                      const newButlerId = e.target.value;
                      if (!newButlerId) return;
                      handleAssignButler(
                        activeGuestForEdit.guest_id,
                        activeGuestForEdit.room_id,
                        newButlerId
                      );
                    }}
                  // onBlur={(e) => validateSingleField(butlerManagementSchema, "butler_id", e.target.value, setFormErrors)}
                  // onKeyUp={(e) => validateSingleField(butlerManagementSchema, "butler_id", e.target.value, setFormErrors)}
                  >
                    <option value="">Select Butler</option>
                    {butlers.map((b) => (
                      <option key={b.butler_id} value={b.butler_id}>
                        {b.butler_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Meal Type Selection */}
              <div className="fullWidth">
                <label>Meal *</label>
                <select
                  className="nicInput"
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value as keyof DailyMealPlan)}
                //   onBlur={(e) => validateSingleField(guestFoodSchema, "meal", e.target.value, setFormErrors)}
                //   onKeyUp={(e) => validateSingleField(guestFoodSchema, "meal", e.target.value, setFormErrors)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="highTea">High Tea</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>

              {/* Add Menu Item */}
              <div className="fullWidth">
                <label>Add Menu Item</label>
                <div className="menuInputRow">
                  <input
                    className="nicInput"
                    placeholder="Enter menu item..."
                    value={menuInput}
                    onChange={(e) => setMenuInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && menuInput.trim()) {
                        handleAddMenuItem();
                      }
                    }}
                  />
                  <button
                    className="addItemBtn"
                    onClick={handleAddMenuItem}
                    disabled={!menuInput.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Current Items for Selected Meal */}
              <div className="fullWidth currentMenuPreview">
                <label>{mealLabels[selectedMeal]} Items</label>
                {dailyPlan[selectedMeal].length === 0 ? (
                  <p className="emptyText">No items added yet</p>
                ) : (
                  <ul className="menuList">
                    {dailyPlan[selectedMeal].map((item, i) => (
                      <li key={i}>
                        {item}
                        <button
                          className="removeItemBtn"
                          onClick={() => handleRemoveMenuItem(selectedMeal, i)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Summary of All Meals */}
              <div className="fullWidth mealPlanOverview">
                <label>Today's Plan Overview</label>
                <div className="mealOverviewGrid">
                  {(Object.entries(dailyPlan) as [keyof DailyMealPlan, string[]][]).map(
                    ([meal, items]) => (
                      <div
                        key={meal}
                        className={`mealOverviewItem ${meal === selectedMeal ? "active" : ""}`}
                        onClick={() => setSelectedMeal(meal)}
                      >
                        <span className="mealLabel">{mealLabels[meal]}</span>
                        <span className="itemCount">{items.length} items</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="nicModalActions">
              <button className="saveBtn" onClick={() => setMenuModalOpen(false)}>
                {menuMode === "create" ? "Save Plan" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SPECIAL REQUEST MODAL ---------------- */}
      {specialReqModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Special Request</h2>
              <button onClick={() => setSpecialReqModalOpen(false)}>✕</button>
            </div>

            {activeGuestForRequest && (
              <div className="modalGuestInfo">
                <strong>{activeGuestForRequest.guest_name}</strong>
                <span> • Room {activeGuestForRequest.room_id ?? "N/A"}</span>
              </div>
            )}

            <div className="nicFormGrid">
              <div className="fullWidth">
                <label>Request Details</label>
                <textarea
                  className="nicInput"
                  rows={4}
                  placeholder="Enter special food request (e.g. no onion, Jain food, allergies)…"
                  value={specialReqText}
                  onChange={(e) => setSpecialReqText(e.target.value)}
                />
              </div>
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setSpecialReqModalOpen(false)}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={saveSpecialRequest}>
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodService;
