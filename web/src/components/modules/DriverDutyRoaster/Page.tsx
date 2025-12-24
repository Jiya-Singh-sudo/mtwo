import { useEffect, useState } from "react";
import { Clock, Eye, Edit, X } from "lucide-react";

import { getActiveDriverDutyRoasters } from "../../../api/driverDutyRoaster.api";
import { DriverDutyRoaster } from "@/types/driverDutyRoaster";
import "./DriverDutyRoaster.css";

export default function DriverDutyRoasterPage() {
  const [rosters, setRosters] = useState<DriverDutyRoaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewItem, setViewItem] = useState<DriverDutyRoaster | null>(null);
  const [editItem, setEditItem] = useState<DriverDutyRoaster | null>(null);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getActiveDriverDutyRoasters();

        if (mounted && Array.isArray(data)) {
          setRosters(data);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load driver duty roaster");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  /* ================= HELPERS ================= */

  const renderDay = (
    inTime?: string | null,
    outTime?: string | null,
    weekOff?: boolean
  ) => {
    if (weekOff) return <span className="weekOff">Week Off</span>;
    if (!inTime || !outTime) return <span className="subText">—</span>;

    return (
      <span className="time flex items-center gap-1">
        <Clock size={14} /> {inTime} - {outTime}
      </span>
    );
  };

  /* ================= UI STATES ================= */

  if (loading) return <p className="p-6">Loading duty roaster…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-[#00247D] text-xl font-semibold">
        Driver Duty Roaster
      </h2>

      <div className="rosterTableWrapper">
        <table className="rosterTable">
          <thead>
            <tr>
              <th>Driver ID</th>
              <th>Shift</th>
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thu</th>
              <th>Fri</th>
              <th>Sat</th>
              <th>Sun</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rosters.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center p-4 text-gray-500">
                  No duty roaster records found
                </td>
              </tr>
            )}

            {rosters.map((item) => (
              <tr key={item.roaster_id}>
                <td>{item.driver_id}</td>
                <td className="capitalize">{item.shift}</td>

                <td>{renderDay(item.monday_duty_in_time, item.monday_duty_out_time, item.monday_week_off)}</td>
                <td>{renderDay(item.tuesday_duty_in_time, item.tuesday_duty_out_time, item.tuesday_week_off)}</td>
                <td>{renderDay(item.wednesday_duty_in_time, item.wednesday_duty_out_time, item.wednesday_week_off)}</td>
                <td>{renderDay(item.thursday_duty_in_time, item.thursday_duty_out_time, item.thursday_week_off)}</td>
                <td>{renderDay(item.friday_duty_in_time, item.friday_duty_out_time, item.friday_week_off)}</td>
                <td>{renderDay(item.saturday_duty_in_time, item.saturday_duty_out_time, item.saturday_week_off)}</td>
                <td>{renderDay(item.sunday_duty_in_time, item.sunday_duty_out_time, item.sunday_week_off)}</td>

                <td>
                  <span className={`statusPill ${item.is_active ? "Active" : "Inactive"}`}>
                    {item.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>
                  <div className="actionBtns">
                    <button onClick={() => setViewItem(item)}>
                      <Eye size={16} />
                    </button>
                    <button onClick={() => setEditItem(item)}>
                      <Edit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h3>Driver Duty Details</h3>
              <button onClick={() => setViewItem(null)}>
                <X />
              </button>
            </div>

            <p><b>Driver:</b> {viewItem.driver_id}</p>
            <p><b>Shift:</b> {viewItem.shift}</p>
            <p><b>Status:</b> {viewItem.is_active ? "Active" : "Inactive"}</p>
          </div>
        </div>
      )}
    </div>
  );
}