import { useEffect, useState } from "react";
import { UtensilsCrossed, Users, CheckCircle, AlertCircle, Eye, FileEdit, Trash2, Plus } from "lucide-react";
import "./FoodService.css";
import { getFoodDashboard, updateFoodStatus, getTodayGuestOrders } from "@/api/guestFood.api";
import { FoodDashboard, GuestMealUI } from "../../../types/guestFood";
import { getActiveButlers, createButler, updateButler, softDeleteButler, getButlerTable } from "@/api/butler.api";
import { createGuestButler, softDeleteGuestButler } from "@/api/guestButler.api";
import { useTableQuery } from "@/hooks/useTableQuery";
import { Butler } from "@/types/butler";
import { DataTable, type Column } from "@/components/ui/DataTable";

/* ---------------- TYPES ---------------- */
// type Butler = {
//   butler_id: string;
//   butler_name: string;
//   shift: string;
//   is_active: boolean;
// };
type ButlerMode = "add" | "view" | "edit";

export function FoodService() {
  const butlerTable = useTableQuery({
    sortBy: "butler_name",
    sortOrder: "asc",
  });

  /* ---------------- TAB STATE ---------------- */
  const [activeTab, setActiveTab] =
    useState<"butler" | "food">("food");

  /* ---------------- FOOD SERVICE STATE ---------------- */
  const [stats, setStats] = useState<FoodDashboard | null>(null);
  // const [schedule, setSchedule] = useState<MealSchedule[]>([]);
  // const [loading, setLoading] = useState(false);

  /* ---------------- BUTLER MANAGEMENT STATE ---------------- */
  const [butlers, setButlers] = useState<Butler[]>([]);
  // const [loadingButlers, setLoadingButlers] = useState(false);
  const [guestOrders, setGuestOrders] = useState<any[]>([]);
  // const [collapsedMeals, setCollapsedMeals] = useState<string[]>([]);

  const [butlerModalOpen, setButlerModalOpen] = useState(false);
  const [butlerMode, setButlerMode] = useState<ButlerMode>("add");
  const [activeButler, setActiveButler] = useState<Butler | null>(null);

  const [butlerForm, setButlerForm] = useState({
    butler_name: "",
    butler_name_local_language: "",
    butler_mobile: "",
    butler_alternate_mobile: "",
    shift: "",
    address: "",
    remarks: "",
  });

  type ButlerAssignmentContext = {
    guestId: string;
    roomId: string;

    guestName: string;
    roomNumber: string;
    meal: "Breakfast" | "Lunch" | "Dinner" | "Other";
  };

  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [assignContext, setAssignContext] = useState<ButlerAssignmentContext | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    butlerId: "",
    serviceTime: "",
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

  async function loadGuestOrders() {
    try {
      const res = await getTodayGuestOrders();
      setGuestOrders(res);
    } catch (err) {
      console.error("Failed to load guest orders", err);
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
  // async function loadButlers() {
  //   setLoadingButlers(true);
  //   try {
  //     const res = await getActiveButlers();
  //     setButlers(res);
  //   } catch (err) {
  //     console.error("Failed to load butlers", err);
  //   } finally {
  //     setLoadingButlers(false);
  //   }
  // }

  useEffect(() => {
    if (activeTab === "butler") {
      loadButlers();
    }
  }, [butlerTable.query, activeTab]);

  useEffect(() => {
    loadFoodData();
    loadButlers();
    loadGuestOrders();
  }, []);

  /* ---------------- ACTIONS ---------------- */

  async function markDelivered(guestFoodId: string) {
    await updateFoodStatus(guestFoodId, {
      delivery_status: "Delivered",
      delivered_datetime: new Date().toISOString(),
    });
    await loadFoodData();
    await loadGuestOrders(); // 🔥 REQUIRED
  }

  async function unassignButler(guestButlerId: string) {
    if (!confirm("Unassign this butler from the guest?")) return;
    try {
      await softDeleteGuestButler(guestButlerId);
      await loadGuestOrders();
    } catch (err) {
      console.error("Failed to unassign butler", err);
      alert("Failed to unassign butler");
    }
  }
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

  function mapToGuestMealUI(order: any): GuestMealUI {
    return {
      guestFoodId: order.guest_food_id,

      guestId: order.guest_id,
      roomId: order.room_id,

      guestName: order.guest_name,
      roomNumber: order.room_number,

      meal: order.meal,
      foodItems: order.menu ?? [],
      foodType: order.food_type ?? "Veg",
      status: order.delivery_status,

      butler: order.butler_id
        ? {
          id: order.butler_id,
          name: order.butler_name,
          guestButlerId: order.guest_butler_id, // ✅ NEW
        }
        : undefined,
    };
  }


  type MealLaneProps = {
    meal: "Breakfast" | "Lunch" | "Dinner" | "Other";
    window: string;
    guests: GuestMealUI[];
  };
  function MealLane({ meal, window, guests }: MealLaneProps) {
    return (
      <section className={`mealLane ${isCurrentMeal(window) ? "activeMeal" : ""}`}>
        {/* Header */}
        <div className="mealLaneHeader">
          <div className="laneTitle">
            <h3>{meal}</h3>
            <span className="mealWindow">{window}</span>
          </div>

          <div className="laneStats">
            <span>{guests.length} Guests</span>
            <span className="pendingCount">
              {guests.filter(g => g.status !== "Delivered").length} Pending
            </span>
          </div>
        </div>

        {/* ✅ Content */}
        {guests.length === 0 ? (
          <div className="emptyLane">
            <UtensilsCrossed size={18} />
            <span>No orders scheduled</span>
          </div>
        ) : (
          <div className="mealCardGrid">
            {guests.map(g => (
              <GuestMealCard key={g.guestFoodId} data={g} />
            ))}
          </div>
        )}
      </section>
    );
  }
  type GuestMealCardProps = {
    data: GuestMealUI;
  };

  function GuestMealCard({ data }: GuestMealCardProps) {
    return (
      <div className={`guestMealCard status-${data.status.toLowerCase()}`}>
        {/* Guest identity */}
        <div className="guestInfo">
          <h4 className="guestName">{data.guestName}</h4>
          <span className="roomNumber">Room {data.roomNumber}</span>
        </div>

        {/* Food info */}
        <div className="foodInfo">
          <div className="foodType">{data.foodType}</div>
          <div className="foodItems">
            {data.foodItems.join(", ")}
          </div>
        </div>

        {/* Butler assignment */}
        <div className="butlerInfo">
          {data.butler ? (
            <div className="assignedButler">
              <span>Butler: {data.butler.name}</span>

              <button
                className="unassignBtn"
                onClick={() => data.butler?.guestButlerId && unassignButler(data.butler.guestButlerId)}
              >
                Unassign
              </button>
            </div>
          ) : (
            <button
              className="assignButlerBtn"
              onClick={() => {
                setAssignContext({
                  guestId: data.guestId,
                  roomId: data.roomId,
                  guestName: data.guestName,
                  roomNumber: data.roomNumber,
                  meal: data.meal,
                });
                setAssignDrawerOpen(true);
              }}
            >
              Assign Butler
            </button>
          )}
        </div>

        {/* Status + actions */}
        <div className="cardFooter">
          <span className={`statusBadge ${data.status}`}>
            {data.status}
          </span>

          {data.status !== "Delivered" && (
            <button className="primaryActionBtn" onClick={() => markDelivered(data.guestFoodId)}>
              Mark Delivered
            </button>
          )}
        </div>
      </div>
    );
  }
  async function submitButlerAssignment() {
    if (!assignmentForm.butlerId) {
      alert("Please select a butler");
      return;
    }

    try {
      await createGuestButler({
        guest_id: assignContext!.guestId,
        room_id: assignContext!.roomId,
        butler_id: assignmentForm.butlerId,

        service_type: assignContext!.meal,
        service_date: new Date().toISOString().split("T")[0],
        service_time: assignmentForm.serviceTime || undefined,

        remarks: assignmentForm.remarks || undefined,
      });
      setAssignDrawerOpen(false);
      setAssignmentForm({
        butlerId: "",
        serviceTime: "",
        remarks: "",
      });

      loadGuestOrders(); // refresh cards
    } catch (err) {
      console.error(err);
      alert("Failed to assign butler");
    }
  }
  function isCurrentMeal(window: string) {
    const parts = window.split("–").map(s => s.trim());
    if (parts.length !== 2) return false;

    const [start, end] = parts;
    const now = new Date().toTimeString().slice(0, 5);
    return now >= start && now <= end;
  }

  const breakfastGuests: GuestMealUI[] = guestOrders.filter((o) => o.meal === "Breakfast").map(mapToGuestMealUI);
  const lunchGuests: GuestMealUI[] = guestOrders.filter((o) => o.meal === "Lunch").map(mapToGuestMealUI);
  const dinnerGuests: GuestMealUI[] = guestOrders.filter((o) => o.meal === "Dinner").map(mapToGuestMealUI);
  const otherGuests: GuestMealUI[] = guestOrders.filter(o => o.meal === "Other").map(mapToGuestMealUI);

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
      render: (b) => (b.is_active ? "Active" : "Inactive"),
    },
    {
      header: "Actions",
      render: (b) => (
        <div className="actionCell">
          <button className="iconBtn" onClick={() => openViewButler(b as any)}>
            <Eye size={16} />
          </button>
          <button className="iconBtn edit" onClick={() => openEditButler(b as any)}>
            <FileEdit size={16} />
          </button>
          <button className="iconBtn delete" onClick={() => removeButler(b as any)}>
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
          <p>खाद्य सेवा – Butler & Guest Food Management</p>
        </div>
      </div>

      {/* STATS */}
      <div className="statsGrid">
        <div className="statCard blue">
          <Users />
          <div>
            <p>Total Guests</p>
            <h3>{stats?.totalGuests ?? 0}</h3>
          </div>
        </div>

        <div className="statCard green">
          <CheckCircle />
          <div>
            <p>Meals Served</p>
            <h3>{stats?.mealsServed ?? 0}</h3>
          </div>
        </div>

        <div className="statCard orange">
          <AlertCircle />
          <div>
            <p>Special Requests</p>
            <h3>{stats?.specialRequests ?? 0}</h3>
          </div>
        </div>

        <div className="statCard purple">
          <UtensilsCrossed />
          <div>
            <p>Menu Items</p>
            <h3>{stats?.menuItems ?? 0}</h3>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="nicTabs">
        <button
          className={`nicTab ${activeTab === "food" ? "active" : ""}`}
          onClick={() => setActiveTab("food")}
        >
          Guest Food Service
        </button>

        <button
          className={`nicTab ${activeTab === "butler" ? "active" : ""}`}
          onClick={() => setActiveTab("butler")}
        >
          Butler Management
        </button>
      </div>

      {/* ---------------- GUEST FOOD SERVICE TAB ---------------- */}
      {activeTab === "food" && (
        <>
          {/* MEAL SCHEDULE */}
          <div className="bg-white border rounded-sm">
            <div className="border-b px-6 py-4">
              <h3 className="text-[#00247D]">Today's Meal Schedule</h3>
            </div>
            <MealLane
              meal="Breakfast"
              window="07:00 – 10:00"
              guests={breakfastGuests}
            />

            <MealLane
              meal="Lunch"
              window="12:30 – 15:00"
              guests={lunchGuests}
            />

            <MealLane
              meal="Dinner"
              window="19:00 – 22:00"
              guests={dinnerGuests}
            />
            <MealLane
              meal="Other"
              window="All Day"
              guests={otherGuests}
            />
          </div>
        </>
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
          {/* {loadingButlers && <p>Loading butlers…</p>}

          {!loadingButlers && (
            <table className="nicTable">
              <thead>
                <tr>
                  <th>Butler ID</th>
                  <th>Name</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {butlers.map((b) => (
                  <tr key={b.butler_id}>
                    <td>{b.butler_id}</td>
                    <td>{b.butler_name}</td>
                    <td>{b.shift}</td>
                    <td>
                      {b.is_active ? "Active" : "Inactive"}
                    </td>
                    <td className="actionCell">
                      <button className="iconBtn" onClick={() => openViewButler(b)}>
                        <Eye size={16} />
                      </button>

                      <button className="iconBtn edit" onClick={() => openEditButler(b)}>
                        <FileEdit size={16} />
                      </button>

                      <button className="iconBtn delete" onClick={() => removeButler(b)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )} */}
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

            <div className="nicFormGrid">
              <div>
                <label>Butler Name *</label>
                <input
                  className="nicInput"
                  disabled={butlerMode === "view"}
                  value={butlerForm.butler_name}
                  onChange={(e) =>
                    setButlerForm({ ...butlerForm, butler_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Local Language Name</label>
                <input
                  className="nicInput"
                  disabled={butlerMode === "view"}
                  value={butlerForm.butler_name_local_language}
                  onChange={(e) =>
                    setButlerForm({
                      ...butlerForm,
                      butler_name_local_language: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Mobile *</label>
                <input
                  className="nicInput"
                  disabled={butlerMode === "view"}
                  value={butlerForm.butler_mobile}
                  onChange={(e) =>
                    setButlerForm({ ...butlerForm, butler_mobile: e.target.value })
                  } />
              </div>

              <div>
                <label>Alternate Mobile</label>
                <input
                  className="nicInput"
                  disabled={butlerMode === "view"}
                  value={butlerForm.butler_alternate_mobile}
                  onChange={(e) =>
                    setButlerForm({
                      ...butlerForm,
                      butler_alternate_mobile: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Shift *</label>
                <select
                  className="nicInput"
                  disabled={butlerMode === "view"}
                  value={butlerForm.shift}
                  onChange={(e) =>
                    setButlerForm({
                      ...butlerForm,
                      shift: e.target.value,
                    })
                  }>
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
                  disabled={butlerMode === "view"}
                  value={butlerForm.address}
                  onChange={(e) =>
                    setButlerForm({ ...butlerForm, address: e.target.value })
                  } />
              </div>

              <div className="fullWidth">
                <label>Remarks</label>
                <textarea
                  className="nicInput"
                  rows={2}
                  disabled={butlerMode === "view"}
                  value={butlerForm.remarks}
                  onChange={(e) =>
                    setButlerForm({ ...butlerForm, remarks: e.target.value })
                  } />
              </div>
            </div>

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setButlerModalOpen(false)}>
                Cancel
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

      {/* ---------------- ASSIGN BUTLER MODAL ---------------- */}
      {assignDrawerOpen && assignContext && (
        <div className="modalOverlay">
          <div className="nicModal">

            {/* Header */}
            <div className="nicModalHeader">
              <h2>Assign Butler</h2>
              <button onClick={() => setAssignDrawerOpen(false)}>✕</button>
            </div>

            {/* Context */}
            <div className="assignContextCard">
              <div>
                <strong>{assignContext.guestName}</strong>
                <div className="mutedText">
                  Room {assignContext.roomNumber}
                </div>
              </div>
              <span className="mealTag">{assignContext.meal}</span>
            </div>

            {/* Form */}
            <div className="nicFormGrid">

              <div className="fullWidth">
                <label>Butler *</label>
                <select
                  className="nicInput"
                  value={assignmentForm.butlerId}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, butlerId: e.target.value })
                  }
                >
                  <option value="">Select Butler</option>
                  {butlers.map((b) => (
                    <option key={b.butler_id} value={String(b.butler_id)}>
                      {b.butler_name} ({b.shift})
                    </option>
                  ))}
                </select>
              </div>

              <div className="fullWidth">
                <label>Service Time</label>
                <input
                  type="time"
                  className="nicInput"
                  value={assignmentForm.serviceTime}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, serviceTime: e.target.value })
                  }
                />
              </div>

              <div className="fullWidth">
                <label>Remarks</label>
                <textarea
                  className="nicInput"
                  rows={3}
                  value={assignmentForm.remarks}
                  onChange={(e) =>
                    setAssignmentForm({ ...assignmentForm, remarks: e.target.value })
                  }
                />
              </div>

            </div>

            {/* Actions */}
            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setAssignDrawerOpen(false)}
              >
                Cancel
              </button>

              <button className="saveBtn" onClick={submitButlerAssignment}>
                Assign Butler
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default FoodService;
