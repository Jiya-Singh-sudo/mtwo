import { useEffect, useState } from "react";
import { Clock, Edit, X } from "lucide-react";

import {
    getDriverDutiesByRange,
    updateDriverDuty,
    createDriverDuty,
} from "../../../api/driverDuty.api";

import { DriverDuty, DriverWeeklyRow } from "@/types/driverDuty";
import "./DriverDutyRoaster.css";

export default function DriverDutyRoasterPage() {
    /* ================= STATE ================= */

    const [rosters, setRosters] = useState<DriverWeeklyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewItem, setViewItem] = useState<DriverDuty | null>(null);
    const [editItem, setEditItem] = useState<DriverDuty | null>(null);
    const [editForm, setEditForm] = useState<DriverDuty | null>(null);
    const [saving, setSaving] = useState(false);
    const [weekStartDate, setWeekStartDate] = useState<string>(() => {
        const today = new Date();
        const day = today.getDay() || 7; // Sunday = 7
        today.setDate(today.getDate() - day + 1); // Monday
        return today.toISOString().slice(0, 10);
    });


    /* ================= LOAD DATA ================= */
    const load = async () => {
        const getDateForDay = (weekStart: string, dayIndex: number) => {
            const [y, m, d] = weekStart.split("-").map(Number);
            const date = new Date(Date.UTC(y, m - 1, d + dayIndex));
            return date.toISOString().slice(0, 10);
        };
        const from = weekStartDate;
        const to = getDateForDay(weekStartDate, 6);
        try {
            setLoading(true);
            const duties = await getDriverDutiesByRange(from, to);
            console.log("FROM:", from, "TO:", to);
            console.log("RAW DUTIES:", duties);

            const grouped: Record<string, DriverWeeklyRow> = {};

            for (const d of duties) {
                if (!grouped[d.driver_id]) {
                    grouped[d.driver_id] = {
                        driver_id: d.driver_id,
                        driver_name: d.driver_name,
                        duties: {},
                    };
                }

                if (d.duty_date) {
                    const date = d.duty_date.slice(0, 10);
                    grouped[d.driver_id].duties[date] = d;
                }
            }

            setRosters(Object.values(grouped));

        } catch {
            setError("Failed to load duties");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        load();
    }, [weekStartDate]);

    /* ================= HELPERS ================= */

    const getDateForDay = (weekStart: string, dayIndex: number) => {
        const [y, m, d] = weekStart.split("-").map(Number);
        const date = new Date(Date.UTC(y, m - 1, d + dayIndex));
        return date.toISOString().slice(0, 10);
    };

    const renderDay = (
        inTime?: string | null,
        outTime?: string | null,
        weekOff?: boolean
    ) => {
        if (weekOff) return <span className="weekOff">Week Off</span>;
        if (!inTime || !outTime) return <span className="subText">Pending</span>;

        return (
            <span className="time">
                <Clock size={14} />
                {inTime} – {outTime}
            </span>
        );
    };

    /* ================= UPDATE HANDLER ================= */

    const handleUpdate = async () => {
        if (!editForm) {
            alert("Invalid duty data");
            return;
        }

        try {
            setSaving(true);

            if (editForm.duty_id) {
                // UPDATE
                await updateDriverDuty(editForm.duty_id, {
                    duty_in_time: editForm.duty_in_time,
                    duty_out_time: editForm.duty_out_time,
                    is_week_off: editForm.is_week_off,
                    shift: editForm.shift,
                });
            } else {
                // CREATE
                await createDriverDuty({
                    driver_id: editForm.driver_id,
                    duty_date: editForm.duty_date,
                    shift: editForm.shift,
                    duty_in_time: editForm.duty_in_time ?? undefined,
                    duty_out_time: editForm.duty_out_time ?? undefined,
                    is_week_off: editForm.is_week_off,
                });
            }

            setEditItem(null);
            setEditForm(null);
            await load();

            // reload week
            setWeekStartDate((prev) => prev);
        } catch (err) {
            console.error(err);
            alert("Failed to save duty roaster");
        } finally {
            setSaving(false);
        }
    };


    /* ================= UI STATES ================= */

    if (loading) return <p className="p-6">Loading duty roaster…</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    /* ================= UI ================= */

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-[#00247D] text-xl font-semibold">
                Driver Duty Roaster
            </h2>
            <div className="weekNav">
                <button className="weekNavBtn prev" onClick={() => setWeekStartDate((prev) => prev)}>
                    ← Prev Week
                </button>

                <span className="weekLabel" onClick={() => setWeekStartDate((prev) => prev)}>
                    Week of {weekStartDate}
                </span>

                <button className="weekNavBtn next" onClick={() => setWeekStartDate((prev) => prev)}>
                    Next Week →
                </button>
            </div>
            <div className="rosterTableWrapper">
                <table className="rosterTable">
                    <thead>
                        <tr>
                            <th>Driver Name</th>
                            <th>Mon</th>
                            <th>Tue</th>
                            <th>Wed</th>
                            <th>Thu</th>
                            <th>Fri</th>
                            <th>Sat</th>
                            <th>Sun</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rosters.length === 0 ? (
                            <tr key="no-data">
                                <td colSpan={10} className="text-center p-4 text-gray-500">
                                    No duty roaster records found
                                </td>
                            </tr>
                        ) : (
                            rosters.map((item) => (
                                <tr key={`driver-${item.driver_id}`}>
                                    <td>{item.driver_name ?? "—"}</td>

                                    {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                                        const date = getDateForDay(weekStartDate, dayOffset);
                                        const duty = item.duties[date];

                                        return (
                                            <td key={date}>
                                                {renderDay(
                                                    duty?.duty_in_time,
                                                    duty?.duty_out_time,
                                                    duty?.is_week_off
                                                )}
                                            </td>


                                        );
                                    })}
                                    <td className="actionsCell">
                                        <button
                                            className="editBtn"
                                            onClick={() => {
                                                setEditItem({
                                                    driver_id: item.driver_id,
                                                    duty_date: weekStartDate,
                                                } as DriverDuty);

                                                setEditForm({
                                                    driver_id: item.driver_id,
                                                    duty_date: weekStartDate,
                                                    shift: "morning",
                                                    duty_in_time: null,
                                                    duty_out_time: null,
                                                    is_week_off: false,
                                                } as DriverDuty);
                                                }}
                                            >
                                            <Edit size={16} />
                                        </button>
                                    </td>

                                </tr>
                            ))
                        )}
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

                        <p><b>Driver:</b> {viewItem.driver_name}</p>
                        <p><b>ID:</b> {viewItem.driver_id}</p>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editItem && editForm && (
                <div className="modalOverlay">
                    <div className="nicModal large">
                        <div className="nicModalHeader">
                            <h3>Edit Duty Roaster</h3>
                            <button onClick={() => setEditItem(null)}>
                                <X />
                            </button>
                        </div>

                        <div className="editHeaderFields">
                            <div className="editForm space-y-4">
                                <label>
                                    Shift
                                    <select
                                        value={editForm.shift}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, shift: e.target.value as any })
                                        }
                                    >
                                        <option value="morning">Morning</option>
                                        <option value="afternoon">Afternoon</option>
                                        <option value="night">Night</option>
                                    </select>
                                </label>

                                <label className="flex gap-2 items-center">
                                    <input
                                        type="checkbox"
                                        checked={editForm.is_week_off}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                is_week_off: e.target.checked,
                                                ...(e.target.checked
                                                    ? { duty_in_time: null, duty_out_time: null }
                                                    : {}),
                                            })
                                        }
                                    />
                                    Week Off
                                </label>

                                {!editForm.is_week_off && (
                                    <>
                                        <input
                                            type="time"
                                            value={editForm.duty_in_time ?? ""}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, duty_in_time: e.target.value })
                                            }
                                        />
                                        <input
                                            type="time"
                                            value={editForm.duty_out_time ?? ""}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, duty_out_time: e.target.value })
                                            }
                                        />
                                    </>
                                )}
                            </div>

                        </div>

                        <div className="nicModalActions">
                            <button className="saveBtn" onClick={handleUpdate} disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
