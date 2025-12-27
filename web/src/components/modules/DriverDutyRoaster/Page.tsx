import { useEffect, useState } from "react";
import { Clock, Eye, Edit, X } from "lucide-react";

import {
    getDriverRoasterWithDrivers,
    updateDriverDutyRoaster,
} from "../../../api/driverDutyRoaster.api";

import { DriverDutyRoasterRow } from "@/types/driverDutyRoaster";
import "./DriverDutyRoaster.css";

export default function DriverDutyRoasterPage() {
    /* ================= STATE ================= */

    const [rosters, setRosters] = useState<DriverDutyRoasterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewItem, setViewItem] = useState<DriverDutyRoasterRow | null>(null);
    const [editItem, setEditItem] = useState<DriverDutyRoasterRow | null>(null);
    const [editForm, setEditForm] = useState<DriverDutyRoasterRow | null>(null);

    const [saving, setSaving] = useState(false);

    /* ================= LOAD DATA ================= */

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                setLoading(true);
                const data = await getDriverRoasterWithDrivers();

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
        weekOff?: boolean | null
    ) => {
        if (weekOff) {
            return <span className="weekOff">Week Off</span>;
        }

        // 👇 THIS is where your "Pending" goes
        if (!inTime && !outTime) {
            return <span className="subText italic text-gray-400">Pending</span>;
        }

        // Partial data safety
        if (!inTime || !outTime) {
            return <span className="subText italic text-gray-400">Incomplete</span>;
        }

        return (
            <span className="time flex items-center gap-1">
                <Clock size={14} />
                {inTime} – {outTime}
            </span>
        );
    };


    const renderEditDay = (
        label: string,
        inKey: keyof DriverDutyRoasterRow,
        outKey: keyof DriverDutyRoasterRow,
        offKey: keyof DriverDutyRoasterRow
    ) => {
        if (!editForm) return null;

        const isOff = Boolean(editForm[offKey]);

        return (
            <div className="dayRow">
                <strong>{label}</strong>

                <label className="weekOffToggle">
                    <input
                        type="checkbox"
                        checked={isOff}
                        onChange={(e) =>
                            setEditForm({
                                ...editForm,
                                [offKey]: e.target.checked,
                                ...(e.target.checked
                                    ? { [inKey]: null, [outKey]: null }
                                    : {}),
                            })
                        }
                    />
                    Week Off
                </label>

                {!isOff && (
                    <>
                        <input
                            type="time"
                            value={(editForm[inKey] as string) || ""}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    [inKey]: e.target.value,
                                })
                            }
                        />
                        <input
                            type="time"
                            value={(editForm[outKey] as string) || ""}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    [outKey]: e.target.value,
                                })
                            }
                        />
                    </>
                )}
            </div>
        );
    };

    /* ================= UPDATE HANDLER ================= */

    const handleUpdate = async () => {
        if (!editForm || !editForm.duty_roaster_id) {
            console.error("Missing duty_roaster_id", editForm);
            alert("Invalid duty roaster. Cannot update.");
            return;
        }

        try {
            setSaving(true);

            await updateDriverDutyRoaster(editForm.duty_roaster_id, {
                monday_duty_in_time: editForm.monday_in_time ?? undefined,
                monday_duty_out_time: editForm.monday_out_time ?? undefined,
                monday_week_off: editForm.monday_week_off ?? undefined,

                tuesday_duty_in_time: editForm.tuesday_in_time ?? undefined,
                tuesday_duty_out_time: editForm.tuesday_out_time ?? undefined,
                tuesday_week_off: editForm.tuesday_week_off ?? undefined,

                wednesday_duty_in_time: editForm.wednesday_in_time ?? undefined,
                wednesday_duty_out_time: editForm.wednesday_out_time ?? undefined,
                wednesday_week_off: editForm.wednesday_week_off ?? undefined,

                thursday_duty_in_time: editForm.thursday_in_time ?? undefined,
                thursday_duty_out_time: editForm.thursday_out_time ?? undefined,
                thursday_week_off: editForm.thursday_week_off ?? undefined,

                friday_duty_in_time: editForm.friday_in_time ?? undefined,
                friday_duty_out_time: editForm.friday_out_time ?? undefined,
                friday_week_off: editForm.friday_week_off ?? undefined,

                saturday_duty_in_time: editForm.saturday_in_time ?? undefined,
                saturday_duty_out_time: editForm.saturday_out_time ?? undefined,
                saturday_week_off: editForm.saturday_week_off ?? undefined,

                sunday_duty_in_time: editForm.sunday_in_time ?? undefined,
                sunday_duty_out_time: editForm.sunday_out_time ?? undefined,
                sunday_week_off: editForm.sunday_week_off ?? undefined,

                shift: editForm.shift ?? undefined,
                is_active: editForm.is_roaster_active ?? undefined,
            });

            setRosters((prev) =>
                prev.map((r) =>
                    r.duty_roaster_id === editForm.duty_roaster_id ? editForm : r
                )
            );

            setEditItem(null);
            setEditForm(null);
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
                                <tr key={item.duty_roaster_id ?? `driver-${item.driver_id}`}>
                                    <td>{item.driver_name}</td>

                                    <td>{renderDay(item.monday_in_time, item.monday_out_time, item.monday_week_off)}</td>
                                    <td>{renderDay(item.tuesday_in_time, item.tuesday_out_time, item.tuesday_week_off)}</td>
                                    <td>{renderDay(item.wednesday_in_time, item.wednesday_out_time, item.wednesday_week_off)}</td>
                                    <td>{renderDay(item.thursday_in_time, item.thursday_out_time, item.thursday_week_off)}</td>
                                    <td>{renderDay(item.friday_in_time, item.friday_out_time, item.friday_week_off)}</td>
                                    <td>{renderDay(item.saturday_in_time, item.saturday_out_time, item.saturday_week_off)}</td>
                                    <td>{renderDay(item.sunday_in_time, item.sunday_out_time, item.sunday_week_off)}</td>

                                    <td>
                                        <div className="actionBtns">
                                            <button onClick={() => setViewItem(item)}>
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditItem(item);
                                                    setEditForm({ ...item });
                                                }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </div>
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
                            <div>
                                <label className="editLabel">Shift</label>
                                <select
                                    className="editSelect"
                                    value={editForm.shift ?? ""}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, shift: e.target.value as any })
                                    }
                                >
                                    <option value="">Select Shift</option>
                                    <option value="morning">Morning</option>
                                    <option value="afternoon">Afternoon</option>
                                    <option value="night">Night</option>
                                </select>
                            </div>

                            <label className="editCheckbox">
                                <input
                                    type="checkbox"
                                    checked={Boolean(editForm.is_roaster_active)}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            is_roaster_active: e.target.checked,
                                        })
                                    }
                                />
                                Active
                            </label>
                        </div>

                        <div className="editForm">
                            {renderEditDay("Monday", "monday_in_time", "monday_out_time", "monday_week_off")}
                            {renderEditDay("Tuesday", "tuesday_in_time", "tuesday_out_time", "tuesday_week_off")}
                            {renderEditDay("Wednesday", "wednesday_in_time", "wednesday_out_time", "wednesday_week_off")}
                            {renderEditDay("Thursday", "thursday_in_time", "thursday_out_time", "thursday_week_off")}
                            {renderEditDay("Friday", "friday_in_time", "friday_out_time", "friday_week_off")}
                            {renderEditDay("Saturday", "saturday_in_time", "saturday_out_time", "saturday_week_off")}
                            {renderEditDay("Sunday", "sunday_in_time", "sunday_out_time", "sunday_week_off")}
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
