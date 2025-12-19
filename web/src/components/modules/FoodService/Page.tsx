import { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
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

export function FoodService() {
  /* ---------------- STATE ---------------- */
  const [stats, setStats] = useState<FoodDashboard | null>(null);
  const [schedule, setSchedule] = useState<MealSchedule[]>([]);
  const [loading, setLoading] = useState(false);

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
      } else {
        console.error("Unexpected schedule shape:", rawSchedule);
      }

      setSchedule(normalizedSchedule);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* ---------------- ACTION ---------------- */
  async function markDelivered(guestFoodId: string) {
    if (!guestFoodId) return;

    await updateFoodStatus(guestFoodId, {
      delivery_status: "DELIVERED", // ✅ backend enum directly
      delivered_datetime: new Date().toISOString(),
    });

    loadData();
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
              block.data.map((row: MealScheduleRow, idx: number) => (
                <div
                  key={`${block.meal}-${idx}`}
                  className="mealCard"
                >
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

                    {/* ✅ DIRECT ENUM DISPLAY */}
                    <span className={`status ${row.status}`}>
                      {row.status}
                    </span>
                  </div>

                  <div className="mealInfo">
                    <div>
                      Expected Guests: {row.expected_guests}
                    </div>
                    <div>Food Type: {row.food_type}</div>
                    <div>
                      Menu: {row.menu.join(", ")}
                    </div>
                    <div>Status: {row.status}</div>
                  </div>

                  <div className="mealActions">
                    {row.status !== "DELIVERED" ? (
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
    </div>
  );
}

export default FoodService;