import { useEffect, useState } from "react";
import { UtensilsCrossed, Clock, Users, CheckCircle, AlertCircle, Eye, FileEdit, Trash2, Plus } from "lucide-react";
import "./FoodService.css";
import { getFoodDashboard, getTodayMealSchedule, updateFoodStatus } from "@/api/guestFood.api";
import { FoodDashboard, MealSchedule } from "../../../types/guestFood";
import { getActiveButlers, createButler, updateButler, softDeleteButler } from "@/api/butler.api";

/* ---------------- TYPES ---------------- */
type Butler = {
  butler_id: string;
  butler_name: string;
  shift: string;
  is_active: boolean;
};
type ButlerMode = "add" | "view" | "edit";

export function FoodService() {
  /* ---------------- TAB STATE ---------------- */
  const [activeTab, setActiveTab] =
    useState<"butler" | "food">("food");

  /* ---------------- FOOD SERVICE STATE ---------------- */
  const [stats, setStats] = useState<FoodDashboard | null>(null);
  const [schedule, setSchedule] = useState<MealSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- BUTLER MANAGEMENT STATE ---------------- */
  const [butlers, setButlers] = useState<Butler[]>([]);
  const [loadingButlers, setLoadingButlers] = useState(false);

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

  /* ---------------- LOADERS ---------------- */

  async function loadFoodData() {
    setLoading(true);
    try {
      const dashboard = await getFoodDashboard();
      const rawSchedule = await getTodayMealSchedule();

      setStats(dashboard);

      let normalized: MealSchedule[] = [];

      if (Array.isArray(rawSchedule)) normalized = rawSchedule;
      else if (Array.isArray((rawSchedule as any)?.data))
        normalized = (rawSchedule as any).data;

      setSchedule(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadButlers() {
    setLoadingButlers(true);
    try {
      const res = await getActiveButlers();
      setButlers(res);
    } catch (err) {
      console.error("Failed to load butlers", err);
    } finally {
      setLoadingButlers(false);
    }
  }

  useEffect(() => {
    loadFoodData();
    loadButlers();
  }, []);

  /* ---------------- ACTIONS ---------------- */

  async function markDelivered(guestFoodId: string) {
    await updateFoodStatus(guestFoodId, {
      delivery_status: "Delivered",
      delivered_datetime: new Date().toISOString(),
    });
    loadFoodData();
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
    setButlerForm({ ...butler } as any);
    setButlerModalOpen(true);
  }

  function openEditButler(butler: Butler) {
    setButlerMode("edit");
    setActiveButler(butler);
    setButlerForm({ ...butler } as any);
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
    try {
      const payload = {
        butler_name: butlerForm.butler_name,
        butler_name_local_language: butlerForm.butler_name_local_language || undefined,
        mobile: butlerForm.butler_mobile,                     // ✅ FIX
        alternate_mobile: butlerForm.butler_alternate_mobile || undefined,
        shift: butlerForm.shift as "Morning" | "Evening" | "Night" | "Full-Day",
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

          {/* MEAL SCHEDULE */}
          <div className="bg-white border rounded-sm">
            <div className="border-b px-6 py-4">
              <h3 className="text-[#00247D]">Today's Meal Schedule</h3>
            </div>

            <div className="p-6">
              {loading && <p>Loading…</p>}

              {!loading &&
                schedule.map((block) =>
                  block.data.map((row, idx) => (
                    <div key={`${block.meal}-${idx}`} className="mealCard">
                      <div className="mealHeader">
                        <div className="mealLeft">
                          <UtensilsCrossed />
                          <div>
                            <h4>{block.meal}</h4>
                            <span>
                              <Clock size={14} /> {block.window}
                            </span>
                          </div>
                        </div>

                        <span className={`status ${row.status.replace(" ", "")}`}>
                          {row.status}
                        </span>
                      </div>

                      <div className="mealInfo">
                        <div>Expected Guests: {row.expected_guests}</div>
                        <div>Food Type: {row.food_type}</div>
                        <div>Menu: {row.menu.join(", ")}</div>
                      </div>

                      <div className="mealActions">
                        {row.status !== "Delivered" ? (
                          <button
                            className="nicPrimaryBtn"
                            onClick={() =>
                              markDelivered(row.guest_food_id)
                            }
                          >
                            Mark Delivered
                          </button>
                        ) : (
                          <button disabled>Delivered</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
            </div>
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
          {loadingButlers && <p>Loading butlers…</p>}

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
          )}
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
                />
              </div>

              <div>
                <label>Alternate Mobile</label>
                <input
                  className="nicInput"
                  disabled={butlerMode === "view"}
                  value={butlerForm.butler_alternate_mobile}
                />
              </div>

              <div>
                <label>Shift *</label>
                <select
                  className="nicInput"
                  disabled={butlerMode === "view"}
                  value={butlerForm.shift}
                >
                  <option value="">Select</option>
                  <option>Morning</option>
                  <option>Evening</option>
                  <option>Night</option>
                  <option>Full-Day</option>
                </select>
              </div>

              <div className="fullWidth">
                <label>Address</label>
                <textarea
                  className="nicInput"
                  rows={2}
                  disabled={butlerMode === "view"}
                  value={butlerForm.address}
                />
              </div>

              <div className="fullWidth">
                <label>Remarks</label>
                <textarea
                  className="nicInput"
                  rows={2}
                  disabled={butlerMode === "view"}
                  value={butlerForm.remarks}
                />
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
    </div>
  );
}

export default FoodService;
