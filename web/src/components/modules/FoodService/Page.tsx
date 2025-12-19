import { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from "lucide-react";

import "./FoodService.css";

import {
  getFoodDashboard,
  getTodayMealSchedule,
  updateFoodStatus,
} from "@/api/guestFood.api";

import {
  FoodDashboard,
  MealSchedule,
  MealScheduleRow,
} from "../../../types/guestFood";

import api from "@/api/apiClient";

/* ---------------- TYPES ---------------- */

type Butler = {
  id: number;
  name: string;
};

type EnumValue = {
  enum_value: string;
};

export function FoodService() {
  /* ---------------- STATE ---------------- */
  const [stats, setStats] = useState<FoodDashboard | null>(null);
  const [schedule, setSchedule] = useState<MealSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  /* -------- Butler Assignment -------- */
  const [isButlerModalOpen, setIsButlerModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<MealScheduleRow | null>(null);

  const [butlers, setButlers] = useState<Butler[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [butlerForm, setButlerForm] = useState({
    butlerId: "",
    serviceType: "",
    description: "",
    serviceDate: "",
    serviceTime: "",
    remarks: "",
  });

  /* ---------------- LOAD DATA ---------------- */

  async function loadData() {
    setLoading(true);
    try {
      const dashboard = await getFoodDashboard();
      const rawSchedule = await getTodayMealSchedule();

      setStats(dashboard);

      let normalizedSchedule: MealSchedule[] = [];

      if (Array.isArray(rawSchedule)) {
        normalizedSchedule = rawSchedule;
      } else if (Array.isArray((rawSchedule as any)?.data)) {
        normalizedSchedule = (rawSchedule as any).data;
      } else if (Array.isArray((rawSchedule as any)?.schedule)) {
        normalizedSchedule = (rawSchedule as any).schedule;
      }

      setSchedule(normalizedSchedule);
    } catch (err) {
      console.error("Failed to load food schedule", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ---------------- BUTLER LOADERS ---------------- */

  async function loadButlersAndServices() {
    const [butlerRes, serviceRes] = await Promise.all([
      api.get("/butlers"),
      api.get("/enums/butler_service_enum"),
    ]);

    setButlers(butlerRes.data);
    setServiceTypes(serviceRes.data.map((e: EnumValue) => e.enum_value));
  }

  /* ---------------- ACTIONS ---------------- */

  async function markDelivered(guestFoodId: string) {
    if (!guestFoodId) return;

    await updateFoodStatus(guestFoodId, {
      delivery_status: "DELIVERED", // ✅ backend enum directly
      delivered_datetime: new Date().toISOString(),
    });
    loadData();
  }

  function openAssignButler(row: MealScheduleRow) {
    setSelectedRow(row);
    setButlerForm({
      butlerId: "",
      serviceType: "",
      description: "",
      serviceDate: "",
      serviceTime: "",
      remarks: "",
    });
    loadButlersAndServices();
    setIsButlerModalOpen(true);
  }

  async function submitButlerAssignment() {
    if (!selectedRow) return;

    const {
      butlerId,
      serviceType,
      serviceDate,
      serviceTime,
    } = butlerForm;

    if (!butlerId || !serviceType || !serviceDate || !serviceTime) {
      alert("Please fill all required fields.");
      return;
    }

    setAssigning(true);

    try {
      await api.post("/butler-services", {
        guest_food_id: selectedRow.guest_food_id,
        butler_id: butlerId,
        service_type: serviceType,
        description: butlerForm.description || null,
        service_date: serviceDate,
        service_time: serviceTime,
        remarks: butlerForm.remarks || null,
      });

      setIsButlerModalOpen(false);
      alert("Butler assigned successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to assign butler.");
    } finally {
      setAssigning(false);
    }
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="headerRow">
        <div>
          <h2>Food Service Dashboard</h2>
          <p>खाद्य सेवा – Manage meals and delivery status</p>
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
                    <button
                      className="nicPrimaryBtn"
                      onClick={() => openAssignButler(row)}
                    >
                      <UserPlus size={16} /> Assign Butler
                    </button>

                    {row.status !== "Delivered" ? (
                      <button
                        className="nicPrimaryBtn"
                        onClick={() => markDelivered(row.guest_food_id)}
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

      {/* ---------------- ASSIGN BUTLER MODAL ---------------- */}

      {isButlerModalOpen && selectedRow && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>Assign Butler</h2>
              <button onClick={() => setIsButlerModalOpen(false)}>✕</button>
            </div>

            <div className="nicFormGrid">
              <div>
                <label>Butler *</label>
                <select
                  className="nicInput"
                  value={butlerForm.butlerId}
                  onChange={(e) =>
                    setButlerForm({ ...butlerForm, butlerId: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {butlers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Service Type *</label>
                <select
                  className="nicInput"
                  value={butlerForm.serviceType}
                  onChange={(e) =>
                    setButlerForm({
                      ...butlerForm,
                      serviceType: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  {serviceTypes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Service Date *</label>
                <input
                  type="date"
                  className="nicInput"
                  value={butlerForm.serviceDate}
                  onChange={(e) =>
                    setButlerForm({
                      ...butlerForm,
                      serviceDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Service Time *</label>
                <input
                  type="time"
                  className="nicInput"
                  value={butlerForm.serviceTime}
                  onChange={(e) =>
                    setButlerForm({
                      ...butlerForm,
                      serviceTime: e.target.value,
                    })
                  }
                />
              </div>

              <div className="fullWidth">
                <label>Description</label>
                <textarea
                  className="nicInput"
                  rows={2}
                  value={butlerForm.description}
                  onChange={(e) =>
                    setButlerForm({
                      ...butlerForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="fullWidth">
                <label>Remarks</label>
                <textarea
                  className="nicInput"
                  rows={2}
                  value={butlerForm.remarks}
                  onChange={(e) =>
                    setButlerForm({
                      ...butlerForm,
                      remarks: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setIsButlerModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="saveBtn"
                onClick={submitButlerAssignment}
                disabled={assigning}
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodService;