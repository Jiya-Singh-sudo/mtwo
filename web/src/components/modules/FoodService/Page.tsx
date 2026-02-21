import { useEffect, useState } from "react";
import { UtensilsCrossed, Users, CheckCircle, AlertCircle, Eye, FileEdit, Trash2, Plus, Pencil, X } from "lucide-react";
import "./FoodService.css";
import { getFoodDashboard, updateGuestFood, createGuestFood, createDayMealPlan, getTodayMealPlanOverview, getGuestFoodTable } from "@/api/guestFood.api";
import { Input } from "@/components/ui/input";
import { FoodDashboard, GuestFoodTableRow } from "../../../types/guestFood";
import { createButler, updateButler, softDeleteButler, getButlerTable } from "@/api/butler.api";
import { createGuestButler, updateGuestButler } from "@/api/guestButler.api";
import { useTableQuery } from "@/hooks/useTableQuery";
import { Butler } from "@/types/butler";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { butlerManagementSchema } from "@/validation/butler.validation";
// import { guestButlerSchema } from "@/validation/guestButler.validation";
// import { guestFoodSchema } from "@/validation/guestFood.validation";
// import { mealManagementSchema } from "@/validation/meals.validation";
import { validateSingleField } from "@/utils/validateSingleField";
import { getActiveMeals, createMeal } from "@/api/meals.api";
import { useError } from "@/context/ErrorContext";

/* ---------------- TYPES ---------------- */
type ButlerMode = "add" | "view" | "edit";

type DailyMealPlan = {
  breakfast: string[];
  lunch: string[];
  highTea: string[];
  dinner: string[];
};

export type TodayGuestOrderRow = {
  guest_food_id: string;
  guest_id: string;
  room_id: string;

  guest_name: string;
  room_number: string;

  food_id: string;
  food_name: string;
  food_type: string;

  meal_type: "Breakfast" | "Lunch" | "High Tea" | "Dinner";
  plan_date: string;
  food_stage: 'PLANNED' | 'ORDERED' | 'DELIVERED' | 'CANCELLED';

  delivery_status: string;

  order_datetime: string;
  delivered_datetime?: string | null;

  butler_id?: string | null;
  butler_name?: string | null;
  specialrequest?: string | null;
};

// type GuestWithButler = ActiveGuestRow & {
//   butler?: {
//     id: string;
//     name: string;
//     guestButlerId?: string;
//   };

//   foodItems: Record<
//     "Breakfast" | "Lunch" | "High Tea" | "Dinner",
//     {
//       guest_food_id: string;
//       food_name: string;
//       delivery_status: string;
//     }[]
//   >;


//   foodStatus: "Served" | "Not Served";
//   specialRequest?: string;
// };
type GuestWithButler = {
  guest_id: string;
  guest_name: string;
  guest_name_local_language?: string | null;
  guest_mobile?: string | null;

  room_id?: string | null;
  designation_name?: string | null;
  organization?: string | null;

  foodItems: Record<
    "Breakfast" | "Lunch" | "High Tea" | "Dinner",
    {
      guest_food_id: string;
      food_name: string;
      delivery_status: string;
    }[]
  >;

  foodStatus: "Served" | "Not Served";

  butler?: {
    id: string;
    name: string;
    guestButlerId?: string;
  };

  specialRequest?: string;
};

export function FoodService() {
  // const butlerTable = useTableQuery({
  //   sortBy: "butler_name",
  //   sortOrder: "asc",
  // });
  const butlerTable = useTableQuery({
    prefix: "butler",
    page: 1,
    limit: 6,
    sortBy: "butler_name",
    sortOrder: "asc",
    status: "Active",
  });

  const { showError } = useError();

  const foodTable = useTableQuery({
    prefix: "food",
    page: 1,
    limit: 6,
    sortBy: "entry_date",
    sortOrder: "desc",
    status: "Entered" as const,
  });



  /* ---------------- TAB STATE ---------------- */
  const [activeTab, setActiveTab] =
    useState<"butler" | "food">("food");

  /* ---------------- FOOD SERVICE STATE ---------------- */
  const [_formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<FoodDashboard | null>(null);
  const [foodRows, setFoodRows] = useState<GuestFoodTableRow[]>([]);
  const [butlerAssignModalOpen, setButlerAssignModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // const [searchQuery, setSearchQuery] = useState("");
  // const [statsFilter, setStatsFilter] = useState<"ALL" | "SERVED" | "SPECIAL" | "MENU">("ALL");
  const [dailyPlan, setDailyPlan] = useState<DailyMealPlan>({
    breakfast: [],
    lunch: [],
    highTea: [],
    dinner: [],
  });


  /* ---------------- DAILY MEAL PLAN (UI-ONLY, ONE FOR ALL GUESTS) ---------------- */
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<keyof DailyMealPlan>("breakfast");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [newFoodName, setNewFoodName] = useState<string>("");
  const [newFoodType, setNewFoodType] = useState<
    "Veg" | "Non-Veg" | "Jain" | "Vegan" | "Egg"
  >("Veg");
  const [menuMode, setMenuMode] = useState<"create" | "edit">("create");
  const [activeGuestForEdit, setActiveGuestForEdit] = useState<GuestWithButler | null>(null);


  /* ---------------- SPECIAL REQUEST MODAL STATE ---------------- */
  const [specialReqModalOpen, setSpecialReqModalOpen] = useState(false);
  const [specialReqText, setSpecialReqText] = useState("");
  const [activeGuestForRequest, _setActiveGuestForRequest] = useState<GuestWithButler | null>(null);


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



  function normalizeMealType(
    meal?: string | null
  ): "Breakfast" | "Lunch" | "High Tea" | "Dinner" | null {
    if (!meal) return null;

    switch (meal.trim().toLowerCase()) {
      case "breakfast":
        return "Breakfast";
      case "lunch":
        return "Lunch";
      case "high tea":
      case "hightea":
      case "high_tea":
        return "High Tea";
      case "dinner":
        return "Dinner";
      default:
        return null;
    }
  }

  /* ---------------- LOADERS ---------------- */
  async function openEditFood(row: GuestFoodTableRow) {
    setMenuMode("edit");

    setActiveGuestForEdit({
      guest_id: row.guest_id,
      guest_name: row.guest_name,
      room_id: row.room_id ?? null,
    } as any);

    // 🔥 LOAD TODAY'S MASTER PLAN (NOT GUEST ASSIGNMENTS)
    const data = await getTodayMealPlanOverview();

    setDailyPlan({
      breakfast: data.Breakfast ?? [],
      lunch: data.Lunch ?? [],
      highTea: data["High Tea"] ?? [],
      dinner: data.Dinner ?? [],
    });

    setSelectedMeal("breakfast");
    setMenuModalOpen(true);
  }
  // function openEditFood(row: GuestFoodTableRow) {
  //   setMenuMode("edit");

  //   setActiveGuestForEdit({
  //     guest_id: row.guest_id,
  //     guest_name: row.guest_name,
  //     room_id: row.room_id,
  //   } as any);

  //   // 🔥 LOAD EXISTING GUEST FOOD
  //   const existing = foodRows.filter(r => r.guest_id === row.guest_id);

  //   const mappedPlan: DailyMealPlan = {
  //     breakfast: [],
  //     lunch: [],
  //     highTea: [],
  //     dinner: [],
  //   };

  //   existing.forEach(item => {
  //     const meal = normalizeMealType(item.meal_type);
  //     if (!meal) return;
  //     const key = (
  //       meal === "High Tea"
  //         ? "highTea"
  //         : meal.toLowerCase()
  //     ) as keyof DailyMealPlan;

  //     // Avoid duplicates in the UI list if multiple rows exist for same item (though shouldn't happen often)
  //     if (item.food_id && !mappedPlan[key].includes(item.food_id)) {
  //       mappedPlan[key].push(item.food_id);
  //     }
  //   });

  //   setDailyPlan(mappedPlan);

  //   setSelectedMeal("breakfast");
  //   setMenuModalOpen(true);
  // }
  async function loadFoodData() {
    try {
      const dashboard = await getFoodDashboard();
      setStats(dashboard);
    } catch (err) {
      console.error(err);
    }
  }
  async function loadTodayMealPlan() {
    const data = await getTodayMealPlanOverview();

    setDailyPlan({
      breakfast: data.Breakfast ?? [],
      lunch: data.Lunch ?? [],
      highTea: data["High Tea"] ?? [],
      dinner: data.Dinner ?? [],
    });
  }

  async function loadGuests() {
    foodTable.setLoading(true);

    try {
      const res = await getGuestFoodTable({
        page: foodTable.query.page,
        limit: foodTable.query.limit,
        search: foodTable.query.search || undefined,
        status: foodTable.query.status as any,
        sortBy: foodTable.query.sortBy as any,
        sortOrder: foodTable.query.sortOrder as "asc" | "desc",
        mealType: foodTable.query.mealType as any,
        foodStatus: foodTable.query.foodStatus as any,
        entryDateFrom: foodTable.query.entryDateFrom,
        entryDateTo: foodTable.query.entryDateTo,
      });

      setFoodRows(res.data);
      foodTable.setTotal(res.totalCount);
    } finally {
      foodTable.setLoading(false);
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
      console.log("Butler Query:", butlerTable.query);
    } finally {
      butlerTable.setLoading(false);
    }
  }
  useEffect(() => {
    getActiveMeals().then(setFoodItems);
  }, []);

  useEffect(() => {
    if (activeTab === "butler") {
      loadButlers();
    }
  }, [butlerTable.query, activeTab]);
  useEffect(() => {
  loadButlers();
}, [butlerTable.query]);

  useEffect(() => {
    loadFoodData();
    // loadButlers();
    // loadTodayMealPlan(); // REMOVED: Only load on create mode modal open
  }, []);

  useEffect(() => {
    if (menuModalOpen && menuMode === "create") {
      loadTodayMealPlan();
    }
  }, [menuModalOpen, menuMode]);

  useEffect(() => {
    loadGuests();
  }, [foodTable.query]);


  /* ---------------- BUTLER ASSIGNMENT ---------------- */
  async function handleAssignButler(
    guestId: string,
    roomId: string | null | undefined,
    butlerId: string,
    specialRequest?: string
  ) {
    try {
      await createGuestButler({
        guest_id: guestId,
        room_id: roomId ?? undefined,
        butler_id: butlerId,
        specialRequest: specialRequest
      });

      await loadGuests();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to assign butler");
    }
  }

  /* ---------------- DAILY MEAL PLANNING (UI-ONLY) ---------------- */

  async function handleAddMenuItem() {
    if (!selectedFoodId) return;

    let finalFoodId = selectedFoodId;

    // If new item selected → create in master first
    if (selectedFoodId === "__new__") {
      if (!newFoodName.trim()) return;

      const created = await createMeal({
        food_name: newFoodName.trim(),
        food_type: newFoodType,
      });

      finalFoodId = created.food_id;

      const updated = await getActiveMeals();
      setFoodItems(updated);
    }

    setDailyPlan(prev => ({
      ...prev,
      [selectedMeal]: [...prev[selectedMeal], finalFoodId],
    }));

    setSelectedFoodId("");
    setNewFoodName("");
  }

  function handleRemoveMenuItem(meal: keyof DailyMealPlan, index: number) {
    setDailyPlan((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((_, i) => i !== index),
    }));
  }

  /* ---------------- DERIVED STATS (LIVE FROM UI STATE) ---------------- */
  // const servedCount = guests.filter((g) => g.foodStatus === "Served").length;
  // const specialRequestCount = guests.filter(
  //   (g) => g.specialRequest && g.specialRequest.trim()
  // ).length;

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

  async function saveButler() {
    if (!butlerForm.shift) {
      showError("Please select shift");
      return;
    }

    if (!/^\d+$/.test(butlerForm.butler_mobile)) {
      showError("Mobile number must be numeric");
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
      showError("Failed to save butler");
    }
  }

  /* ---------------- ACTION HANDLERS ---------------- */

  function openAssignButlerModal(row: GuestFoodTableRow) {
    setActiveGuestForEdit({
      guest_id: row.guest_id,
      guest_name: row.guest_name,
      room_id: row.room_id ?? null, // ensure null if undefined
    } as any);

    setButlerAssignModalOpen(true);
  }
  // const guestFoodPlan = async () => {
  //   const mealLabel =
  //     mealLabels[selectedMeal] as "Breakfast" | "Lunch" | "High Tea" | "Dinner";

  //   for (const foodId of dailyPlan[selectedMeal]) {

  //     const already = existing.find(
  //       e => e.food_id === foodId && e.meal_type === mealLabel
  //     );

  //     if (already?.guest_food_id) {
  //       await updateGuestFood(already.guest_food_id, {
  //         meal_type: mealLabel,
  //         plan_date: new Date().toISOString().split("T")[0],
  //         food_stage: "PLANNED",
  //       });
  //     } else {
  //       await createGuestFood({
  //         guest_id: activeGuestForEdit.guest_id,
  //         room_id: activeGuestForEdit.room_id ?? undefined,
  //         food_id: foodId,   // ✅ REQUIRED
  //         quantity: 1,
  //         meal_type: mealLabel,
  //         plan_date: new Date().toISOString().split("T")[0],
  //         food_stage: "PLANNED",
  //       });
  //     }
  //   }
  // }
  /* ---------------- TABLE COLUMNS ---------------- */

  const foodColumns: Column<GuestFoodTableRow>[] = [
    {
      header: "Guest",
      accessor: "guest_name",
      sortable: true,
      sortKey: "guest_name",
    },
    {
      header: "Room",
      accessor: "room_number", // Verify if backend sends 'room_number' or 'room_id' or 'room_no'
    },
    {
      header: "Meal",
      accessor: "meal_type",
      sortable: true,
      sortKey: "meal_type",
    },
    {
      header: "Food Item",
      accessor: "food_name",
    },
    {
      header: "Stage",
      sortable: true,
      sortKey: "food_stage",
      render: (r) => (
        <span className={`statusPill ${r.food_stage?.toLowerCase()}`}>
          {r.food_stage}
        </span>
      ),
    },
    {
      header: "Butler",
      accessor: "butler_name",
      emptyFallback: "-",
    },

    /* ACTIONS COLUMN */
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">

          {/* âœ EDIT FOOD PLAN */}
          <button
            className="iconBtn text-indigo-600"
            title="Edit"
            onClick={() => openEditFood(row)}
          >
            <Pencil size={16} />
          </button>

          {/* âž• ADD FOOD */}
          {/* <button
            className="iconBtn text-blue-600"
            title="Add Food"
            onClick={() => openAddFoodModal(row)}
          >
            <Plus size={16} />
          </button> */}

          {/* ðŸ‘¤ ASSIGN BUTLER */}
          <button
            className="iconBtn text-green-600"
            title="Assign Butler"
            onClick={() => openAssignButlerModal(row)}
          >
            <Users size={16} />
          </button>

        </div>
      ),
    },
  ];



  const butlerColumns: Column<Butler>[] = [
    // {
    //   header: "Butler ID",
    //   accessor: "butler_id",
    //   sortable: true,
    //   sortKey: "butler_id",
    // },
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
          className="statCard blue"
          onClick={() =>
            foodTable.batchUpdate(prev => ({
              ...prev,
              page: 1,
              status: "Entered",
              foodStatus: undefined,
              mealType: undefined,
            }))
          }
        >
          <Users />
          <div>
            <p>Active Guests</p>
            <h3>{foodTable.total}</h3>
          </div>
        </div>

        <div
          className={`statCard green`}
          onClick={() =>
            foodTable.batchUpdate(prev => ({
              ...prev,
              page: 1,
              status: "Entered",
              foodStatus: "SERVED",
            }))
          }
        >
          <CheckCircle />
          <div>
            <p>Meals Served</p>
            <h3>{stats?.mealsServed ?? 0}</h3>
          </div>
        </div>

        <div
          className={`statCard orange`}
          onClick={() =>
            foodTable.batchUpdate(prev => ({
              ...prev,
              page: 1,
            }))
          }
        >
          <AlertCircle />
          <div>
            <p>Special Requests</p>
            <h3>{stats?.specialRequests ?? 0}</h3>
          </div>
        </div>

        <div
          className={`statCard purple`}
          onClick={() =>
            foodTable.batchUpdate(prev => ({
              ...prev,
              page: 1,
            }))
          }
        >
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
          {/* HEADER: Search + Plan Menu */}
          <div className="transportFilters nicCard">

            {/* 🔍 SEARCH */}
            <div className="filterSearch">
              <Input
                placeholder="Search guest / room..."
                value={foodTable.searchInput}
                onChange={(e: any) => foodTable.setSearchInput(e.target.value)}
                className="w-full"
              />
            </div>

            {/* 📅 DATE GROUP */}
            <div className="filterGroup">
              <div>
                <label>From</label>
                <input
                  type="date"
                  className="nicInput"
                  value={foodTable.query.entryDateFrom || ""}
                  onChange={(e) =>
                    foodTable.batchUpdate(prev => ({
                      ...prev,
                      page: 1,
                      entryDateFrom: e.target.value,
                      sortBy: "entry_date",
                      sortOrder: "asc",
                    }))
                  }
                />
              </div>

              <div>
                <label>To</label>
                <input
                  type="date"
                  className="nicInput"
                  value={foodTable.query.entryDateTo || ""}
                  onChange={(e) =>
                    foodTable.batchUpdate(prev => ({
                      ...prev,
                      page: 1,
                      entryDateTo: e.target.value,
                      sortBy: "entry_date",
                      sortOrder: "asc",
                    }))
                  }
                />
              </div>

              <button
                className="secondaryBtn"
                onClick={() =>
                  foodTable.batchUpdate(prev => ({
                    ...prev,
                    page: 1,
                    entryDateFrom: "",
                    entryDateTo: "",
                    sortBy: "entry_date",
                    sortOrder: "desc",
                  }))
                }
              >
                Reset
              </button>
            </div>

            {/* ➕ PLAN MENU */}
            <div className="filterAction">
              <button
                className="nicPrimaryBtn"
                onClick={() => {
                  setMenuMode("create");
                  setActiveGuestForEdit(null);
                  setSelectedMeal("breakfast");
                  setMenuModalOpen(true);
                }}
              >
                <Plus size={16} /> Plan Menu
              </button>
            </div>

          </div>


          {/* <div className="planMenuHeader">
            <div className="searchWrapper">
              <Search size={18} className="searchIcon" />
              <input
                className="nicInput searchInput"
                placeholder="Search guest / room..."
                value={foodTable.searchInput}
                onChange={(e) => foodTable.setSearchInput(e.target.value)}
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
          </div> */}

          {/* TODAY'S MEAL PLAN SUMMARY (optional quick view) */}

          {/* TABLE */}


          <div className="bg-white border rounded-sm overflow-hidden">
            <DataTable
              data={foodRows}
              columns={foodColumns}
              keyField="guest_food_id"
              page={foodTable.query.page}
              limit={foodTable.query.limit}
              totalCount={foodTable.total}
              sortBy={foodTable.query.sortBy}
              sortOrder={foodTable.query.sortOrder}
              loading={foodTable.loading}
              onPageChange={foodTable.setPage}
              onLimitChange={foodTable.setLimit}
              onSortChange={foodTable.setSort}
            />
          </div>
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
              <button onClick={() => setButlerModalOpen(false)}><X size={18} /></button>
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
              <button onClick={() => setDeleteButler(null)}><X size={18} /></button>
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
                    showError("Failed to delete butler");
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ---------------- ASSIGN BUTLER MODAL ---------------- */}
      {butlerAssignModalOpen && activeGuestForEdit && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Assign Butler</h2>
              <button onClick={() => setButlerAssignModalOpen(false)}><X size={18} /></button>
            </div>

            <div className="modalGuestInfo">
              <strong>{activeGuestForEdit.guest_name}</strong>
            </div>

            <select
              className="nicInput"
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;

                handleAssignButler(
                  activeGuestForEdit.guest_id,
                  activeGuestForEdit.room_id,
                  val
                );

                setButlerAssignModalOpen(false);
              }}
            >
              <option value="">Select Butler</option>
              {butlers.map((b) => (
                <option key={b.butler_id} value={b.butler_id}>
                  {b.butler_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ---------------- PLAN MENU MODAL (DAY-LEVEL) ---------------- */}
      {menuModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal wide">
            <div className="nicModalHeader">
              <h2>{menuMode === "create" ? "Plan Today's Menu" : "Edit Menu & Butler"}</h2>
              <button onClick={() => setMenuModalOpen(false)}><X size={18} /></button>
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
                  <select
                    className="nicInput"
                    value={selectedFoodId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedFoodId(val);

                      if (val !== "__new__") {
                        setNewFoodName("");
                      }
                    }}
                  >
                    <option value="">Select Food Item</option>
                    {foodItems.map((f) => (
                      <option key={f.food_id} value={f.food_id}>
                        {f.food_name}
                      </option>
                    ))}
                    <option value="__new__">+ Add New Item</option>
                  </select>

                  {selectedFoodId === "__new__" && (
                    <>
                      <input
                        className="nicInput"
                        placeholder="Enter new food name"
                        value={newFoodName}
                        onChange={(e) => setNewFoodName(e.target.value)}
                      />

                      <select
                        className="nicInput"
                        value={newFoodType}
                        onChange={(e) => setNewFoodType(e.target.value as any)}
                      >
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                        <option value="Jain">Jain</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Egg">Egg</option>
                      </select>
                    </>
                  )}

                  <button
                    className="addItemBtn"
                    onClick={handleAddMenuItem}
                    disabled={!selectedFoodId}
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
                        {foodItems.find(f => f.food_id === item)?.food_name}
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
              <button
                className="saveBtn"
                onClick={async () => {
                  try {
                    if (saving) return;
                    setSaving(true);

                    if (menuMode === "create") {
                      const hasItems = Object.values(dailyPlan).some(arr => arr.length > 0);

                      if (!hasItems) {
                        showError("Please add at least one menu item before saving.");
                        setSaving(false);
                        return;
                      }

                      await createDayMealPlan(dailyPlan);
                      await loadTodayMealPlan();
                      await loadGuests();
                      setMenuModalOpen(false);
                      setSaving(false);
                      return;
                    }

                    if (!activeGuestForEdit) {
                      setSaving(false);
                      return;
                    }

                    const existing = foodRows.filter(
                      r => r.guest_id === activeGuestForEdit.guest_id
                    );

                    const mealLabel =
                      mealLabels[selectedMeal] as "Breakfast" | "Lunch" | "High Tea" | "Dinner";

                    for (const foodId of dailyPlan[selectedMeal]) {
                      const already = existing.find(
                        e => e.food_id === foodId && e.meal_type === mealLabel
                      );

                      if (already?.guest_food_id) {
                        await updateGuestFood(already.guest_food_id, {
                          food_stage: "PLANNED",
                        });
                      } else {
                        await createGuestFood({
                          guest_id: activeGuestForEdit.guest_id,
                          room_id: activeGuestForEdit.room_id ?? undefined,
                          food_id: foodId,
                          quantity: 1,
                          meal_type: mealLabel,
                          plan_date: new Date().toISOString().split("T")[0],
                          food_stage: "PLANNED",
                        });
                      }
                    }

                    await loadGuests();
                    setMenuModalOpen(false);
                  } catch (err: any) {
                    showError(err?.response?.data?.message || "Failed to save menu");
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Saving..." : (menuMode === "create" ? "Save Plan" : "Save Changes")}
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
              <button onClick={() => setSpecialReqModalOpen(false)}><X size={18} /></button>
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
              <button
                className="saveBtn"
                onClick={async () => {
                  if (!activeGuestForRequest || !specialReqText.trim()) return;

                  try {
                    const row = foodRows.find(
                      r => r.guest_id === activeGuestForRequest.guest_id
                    );

                    if (!row || !(row as any).guest_butler_id) {
                      showError("Please assign a butler first to add special requests.");
                      return;
                    }

                    await updateGuestButler((row as any).guest_butler_id, {
                      specialRequest: specialReqText   // ✅ camelCase ONLY
                    });

                    setSpecialReqModalOpen(false);
                    await loadGuests();
                  } catch (err) {
                    showError("Failed to save special request");
                  }
                }}
              >
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
