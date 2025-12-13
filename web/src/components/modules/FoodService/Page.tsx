import { useState } from "react";
import {
  UtensilsCrossed,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import "./FoodService.css";

type FoodType = "Veg" | "Non-Veg" | "Jain" | "Vegan" | "Egg";

interface Meal {
  meal: "Breakfast" | "Lunch" | "Evening Tea" | "Dinner";
  time: string;
  guests: number;
  menu: string;
  foodType: FoodType;
  status: "Completed" | "In Progress" | "Upcoming";
  specialRequests: number;
}

export function FoodService() {
  /* ---------------- STATE ---------------- */
  const [meals, setMeals] = useState<Meal[]>([
    {
      meal: "Breakfast",
      time: "07:00 - 10:00",
      guests: 28,
      menu: "Poha, Idli, Toast, Fruits, Tea/Coffee",
      foodType: "Veg",
      status: "Completed",
      specialRequests: 2,
    },
    {
      meal: "Lunch",
      time: "12:30 - 15:00",
      guests: 32,
      menu: "Dal, Roti, Rice, Sabzi, Salad, Curd",
      foodType: "Veg",
      status: "In Progress",
      specialRequests: 5,
    },
    {
      meal: "Evening Tea",
      time: "16:00 - 17:00",
      guests: 25,
      menu: "Tea, Coffee, Samosa, Biscuits",
      foodType: "Veg",
      status: "Upcoming",
      specialRequests: 1,
    },
    {
      meal: "Dinner",
      time: "19:30 - 22:00",
      guests: 30,
      menu: "Dal, Roti, Rice, Paneer, Mix Veg, Dessert",
      foodType: "Veg",
      status: "Upcoming",
      specialRequests: 3,
    },
  ]);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const [menuForm, setMenuForm] = useState({
    meal: "Breakfast",
    foodType: "Veg" as FoodType,
    menu: "",
  });

  /* ---------------- ACTIONS ---------------- */

  function openPlanMenu(meal?: Meal) {
    if (meal) {
      setMenuForm({
        meal: meal.meal,
        foodType: meal.foodType,
        menu: meal.menu,
      });
    }
    setIsPlanModalOpen(true);
  }

  function saveMenu() {
    setMeals((prev) =>
      prev.map((m) =>
        m.meal === menuForm.meal
          ? { ...m, menu: menuForm.menu, foodType: menuForm.foodType }
          : m
      )
    );
    setIsPlanModalOpen(false);
  }

  function openViewDetails(meal: Meal) {
    setSelectedMeal(meal);
    setIsViewModalOpen(true);
  }

  /* ---------------- STATS ---------------- */
  const totalGuests = meals.reduce((sum, m) => sum + m.guests, 0);
  const mealsServed = meals.filter((m) => m.status === "Completed").length;
  const specialRequests = meals.reduce((sum, m) => sum + m.specialRequests, 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="headerRow">
        <div>
          <h2>Food Service Dashboard</h2>
          <p>खाद्य सेवा – Manage meals, menus, and dietary requirements</p>
        </div>
        <button className="nicPrimaryBtn" onClick={() => openPlanMenu()}>
          Plan Menu
        </button>
      </div>

      {/* STATS */}
      <div className="statsGrid">
        <div className="statCard blue">
          <Users />
          <div>
            <p>Total Guests</p>
            <h3>{totalGuests}</h3>
          </div>
        </div>
        <div className="statCard green">
          <CheckCircle />
          <div>
            <p>Meals Served</p>
            <h3>{mealsServed}</h3>
          </div>
        </div>
        <div className="statCard orange">
          <AlertCircle />
          <div>
            <p>Special Requests</p>
            <h3>{specialRequests}</h3>
          </div>
        </div>
        <div className="statCard purple">
          <UtensilsCrossed />
          <div>
            <p>Menu Items</p>
            <h3>24</h3>
          </div>
        </div>
      </div>

      {/* MEAL SCHEDULE */}
      <div className="bg-white border rounded-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-[#00247D]">Today's Meal Schedule</h3>
        </div>

        <div className="p-6">
          {meals.map((meal) => (
            <div key={meal.meal} className="mealCard">
              <div className="mealHeader">
                <div className="mealLeft">
                  <UtensilsCrossed />
                  <div>
                    <h4>{meal.meal}</h4>
                    <span>
                      <Clock size={14} /> {meal.time}
                    </span>
                  </div>
                </div>
                <span className={`status ${meal.status.replace(" ", "")}`}>
                  {meal.status}
                </span>
              </div>

              <div className="mealInfo">
                <div>Expected Guests: {meal.guests}</div>
                <div>Food Type: {meal.foodType}</div>
                <div>Menu: {meal.menu}</div>
                <div>Special Requests: {meal.specialRequests}</div>
              </div>

              <div className="mealActions">
                <button onClick={() => openViewDetails(meal)}>
                  View Details
                </button>
                <button onClick={() => openPlanMenu(meal)}>
                  Update Menu
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PLAN MENU MODAL */}
      {isPlanModalOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h3>Plan Menu</h3>
              <button onClick={() => setIsPlanModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="nicForm">
              <div>
                <label>Meal</label>
                <select
                  value={menuForm.meal}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, meal: e.target.value as any })
                  }
                >
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Evening Tea</option>
                  <option>Dinner</option>
                </select>
              </div>

              <div>
                <label>Food Type</label>
                <select
                  value={menuForm.foodType}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      foodType: e.target.value as FoodType,
                    })
                  }
                >
                  <option>Veg</option>
                  <option>Non-Veg</option>
                  <option>Jain</option>
                  <option>Vegan</option>
                  <option>Egg</option>
                </select>
              </div>

              <div>
                <label>Menu Items</label>
                <textarea
                  rows={3}
                  value={menuForm.menu}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, menu: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="nicModalActions">
              <button onClick={() => setIsPlanModalOpen(false)}>Cancel</button>
              <button className="saveBtn" onClick={saveMenu}>
                Save Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {isViewModalOpen && selectedMeal && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h3>{selectedMeal.meal} Details</h3>
              <button onClick={() => setIsViewModalOpen(false)}>
                <X />
              </button>
            </div>

            <div className="mealInfo">
              <p>Time: {selectedMeal.time}</p>
              <p>Guests: {selectedMeal.guests}</p>
              <p>Food Type: {selectedMeal.foodType}</p>
              <p>Menu: {selectedMeal.menu}</p>
              <p>Special Requests: {selectedMeal.specialRequests}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
