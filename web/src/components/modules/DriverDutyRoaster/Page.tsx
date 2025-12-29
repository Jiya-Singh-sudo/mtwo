import { useEffect, useState } from "react";
import { Clock, Edit, X } from "lucide-react";

import {
    getDriverDutiesByRange,
    updateDriverDuty,
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

    useEffect(() => {
        const from = weekStartDate;
        const to = getDateForDay(weekStartDate, 6);

        async function load() {
            try {
                setLoading(true);
                const response = await getDriverDutiesByRange(from, to);
                const duties = response.data;
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
                    grouped[d.driver_id].duties[d.duty_date] = d;
                }

                setRosters(Object.values(grouped));
            } catch {
                setError("Failed to load duties");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [weekStartDate]);



    /* ================= HELPERS ================= */

    const getDateForDay = (weekStart: string, dayIndex: number) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + dayIndex);
        return d.toISOString().slice(0, 10);
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
        if (!editForm || !editForm.duty_id) {
            console.error("Missing duty_roaster_id", editForm);
            alert("Invalid duty roaster. Cannot update.");
            return;
        }

        try {
            setSaving(true);

            await updateDriverDuty(editForm.duty_id, {
                duty_in_time: editForm.duty_in_time,
                duty_out_time: editForm.duty_out_time,
                is_week_off: editForm.is_week_off,
                shift: editForm.shift,
            });

            setEditItem(null);
            setEditForm(null);

            // reload week
            setWeekStartDate((prev) => prev);

        } catch (err) {
            console.error(err);
            alert("Failed to update duty roaster");
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
            <div className="flex gap-4 items-center mb-4">
                <button
                    onClick={() => {
                        const d = new Date(weekStartDate);
                        d.setDate(d.getDate() - 7);
                        setWeekStartDate(d.toISOString().slice(0, 10));
                    }}
                >
                    ← Prev Week
                </button>

                <span className="font-semibold">
                    Week of {weekStartDate}
                </span>

                <button
                    onClick={() => {
                        const d = new Date(weekStartDate);
                        d.setDate(d.getDate() + 7);
                        setWeekStartDate(d.toISOString().slice(0, 10));
                    }}
                >
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

                                                {duty && (
                                                    <button
                                                        onClick={() => {
                                                            setEditItem(duty);
                                                            setEditForm(duty);
                                                        }}
                                                        className="ml-2"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
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
