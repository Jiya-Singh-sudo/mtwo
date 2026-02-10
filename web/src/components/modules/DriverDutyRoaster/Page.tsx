import { useEffect, useState } from "react";
import { Clock, Edit, X } from "lucide-react";
import { getDriverDutiesByRange, updateDriverDuty, createDriverDuty } from "../../../api/driverDuty.api";
import { DriverDuty, DriverWeeklyRow } from "@/types/driverDuty";
import "./DriverDutyRoaster.css";
import { DataTable, type Column } from "@/components/ui/DataTable";
import React from "react";
import TimePicker12h from "@/components/common/TimePicker12h";
import { driverDutyEditSchema } from "@/validation/driverDutyManagement.validation";
import { validateSingleField } from "@/utils/validateSingleField";

type DriverDutyTableRow = {
  driver_id: string;
  driver_name: string;
  mon: React.ReactNode;
  tue: React.ReactNode;
  wed: React.ReactNode;
  thu: React.ReactNode;
  fri: React.ReactNode;
  sat: React.ReactNode;
  sun: React.ReactNode;
};

/* ================= DATE HELPERS ================= */

function getDateForDay(weekStart: string, dayIndex: number): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  // Use UTC to prevent local timezone shifts
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + dayIndex);

  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export default function DriverDutyRoasterPage() {
  /* ================= STATE ================= */
  const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  const [rosters, setRosters] = useState<DriverWeeklyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});


  const [editForm, setEditForm] = useState<DriverDuty | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [weekStartDate, setWeekStartDate] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay() === 0 ? 7 : today.getDay(); // Sun = 7
    today.setDate(today.getDate() - day + 1);

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  });

  /* ================= LOAD DATA ================= */
  const load = async () => {
    try {
      setLoading(true);
      const from = weekStartDate;
      const to = getDateForDay(weekStartDate, 7);
      const duties = await getDriverDutiesByRange(from, to);
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
          const dataKey = toLocalDateKey(d.duty_date);
          grouped[d.driver_id].duties[dataKey] = d;
        }
      }
      setRosters(Object.values(grouped));
    } catch (err) {
      console.error(err);
      setError("Failed to load duties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [weekStartDate]);

  /* ================= RENDER CELL ================= */

  const renderDay = (
    inTime?: string | null,
    outTime?: string | null,
    weekOff?: boolean
  ) => {
    if (weekOff) return <span className="weekOff">Week Off</span>;
    if (!inTime || !outTime) return <span className="pendingDot" title="Not assigned yet">—</span>;

    return (
      <span className="time">
        <Clock size={14} />
        {inTime} – {outTime}
      </span>
    );
  };

  const filteredRosters = rosters
    .filter((r) =>
      r.driver_name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const nameA = a.driver_name?.toLowerCase() ?? "";
      const nameB = b.driver_name?.toLowerCase() ?? "";
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
  });

  const tableData: DriverDutyTableRow[] = filteredRosters.map((row) => {
    const datesByDay = {
      mon: getDateForDay(weekStartDate, 0),
      tue: getDateForDay(weekStartDate, 1),
      wed: getDateForDay(weekStartDate, 2),
      thu: getDateForDay(weekStartDate, 3),
      fri: getDateForDay(weekStartDate, 4),
      sat: getDateForDay(weekStartDate, 5),
      sun: getDateForDay(weekStartDate, 6),
    };

    const cellsByDay = WEEK_DAYS.reduce((acc, day) => {
      const date = datesByDay[day];
      const duty = row.duties[date];
      acc[day] = (
        <div
          className={`dayCell ${duty ? "hasDuty" : ""} ${
            duty?.is_week_off ? "weekOff" : ""
          }`}
        >
          {renderDay(
            duty?.duty_in_time,
            duty?.duty_out_time,
            duty?.is_week_off
          )}

          <button
            className="editBtn"
            onClick={() =>
              setEditForm(
                duty ?? {
                  driver_id: row.driver_id,
                  duty_date: date,
                  shift: "morning", 
                  duty_in_time: null,
                  duty_out_time: null,
                  is_week_off: false,
                  repeat_weekly: false,
                }
              )
            }
          >
            <Edit size={14} />
          </button>
        </div>
      );

      return acc;
    }, {} as Record<typeof WEEK_DAYS[number], React.ReactNode>);

    return {
      driver_id: row.driver_id,
      driver_name: row.driver_name ?? "",
      mon: cellsByDay.mon,
      tue: cellsByDay.tue,
      wed: cellsByDay.wed,
      thu: cellsByDay.thu,
      fri: cellsByDay.fri,
      sat: cellsByDay.sat,
      sun: cellsByDay.sun,
    };
  });
  
  function toLocalDateKey(value: string): string {
    return value.slice(0, 10);
  }
  // function toLocalDateKey(value: string): string {
  //   const date = new Date(value);
  //   const yyyy = date.getFullYear();
  //   const mm = String(date.getMonth() + 1).padStart(2, "0");
  //   const dd = String(date.getDate()).padStart(2, "0");
  //   return `${yyyy}-${mm}-${dd}`;
  // }

  // function shiftWeek(weekStart: string, days: number) {
  //   const [y, m, d] = weekStart.split("-").map(Number);
  //   const date = new Date(Date.UTC(y, m - 1, d + days));
  //   return date.toISOString().slice(0, 10);
  // }
  function shiftWeek(weekStart: string, days: number) {
    const [y, m, d] = weekStart.split("-").map(Number);

    const base = new Date(Date.UTC(y, m - 1, d));
    base.setUTCDate(base.getUTCDate() + days);

    const yyyy = base.getUTCFullYear();
    const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(base.getUTCDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }


  /* ================= SAVE (CREATE / UPDATE) ================= */

  const handleSave = async () => {
    if (!editForm) return;

    if (!editForm.driver_id || !editForm.duty_date || !editForm.shift) {
      alert("Driver, date and shift are required");
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
          repeat_weekly: editForm.repeat_weekly,
          shift: editForm.shift,
        });
      } else {
        // CREATE
        await createDriverDuty({
          driver_id: editForm.driver_id,
          duty_date: editForm.duty_date,
          shift: editForm.shift, // must be enum
          duty_in_time: editForm.duty_in_time ?? undefined,
          duty_out_time: editForm.duty_out_time ?? undefined,
          is_week_off: editForm.is_week_off ?? false,
          repeat_weekly: editForm.repeat_weekly ?? false,
        });
      }

      setEditForm(null);
      setFormErrors({});
      await load();
    } catch (err: any) {
        console.error("Save failed:", err?.response?.data || err);
        alert(err?.response?.data?.message || "Failed to save duty");
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI STATES ================= */

  if (loading) return <p className="p-6">Loading duty roaster…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  const page = 1;
  const limit = tableData.length || 1;
  const totalCount = tableData.length;
  const sortBy = "driver_name";
  // const sortOrder: "asc" | "desc" = "asc";

  const driverColumns: Column<DriverDutyTableRow>[] = [
    {
      header: "Driver Name",
      accessor: "driver_name",
      sortable: true,
      sortKey: "driver_name",
    },
    {
      header: "Mon",
      render: (row) => row.mon,
    },
    {
      header: "Tue",
      render: (row) => row.tue,
    },
    {
      header: "Wed",
      render: (row) => row.wed,
    },
    {
      header: "Thu",
      render: (row) => row.thu,
    },
    {
      header: "Fri",
      render: (row) => row.fri,
    },
    {
      header: "Sat",
      render: (row) => row.sat,
    },
    {
      header: "Sun",
      render: (row) => row.sun,
    },
  ];

  /* ================= UI ================= */

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-[#00247D] text-xl font-semibold">
        Driver Duty Roaster
      </h2>

      <div className="weekNav">
        <button
          className="weekNavBtn prev"
          onClick={() => setWeekStartDate(prev => shiftWeek(prev, -7))}>
          ← Prev Week
        </button>
        <span className="weekLabel">Week of {weekStartDate}</span>
        <button
          className="weekNavBtn next"
          onClick={() => setWeekStartDate(prev => shiftWeek(prev, 7))}>
          Next Week →
        </button>
      </div>
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search driver name..."
          className="border px-3 py-2 rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={50}
        />
      </div>

      <div className="rosterTableWrapper">
        <div className="rosterTable">
        <div className="bg-white border rounded-sm overflow-hidden">

        <DataTable
          data={tableData}
          columns={driverColumns}
          keyField="driver_id"
          loading={loading}
          page={page}
          limit={limit}
          totalCount={totalCount}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onPageChange={() => {}}
          onSortChange={(key, order) => {
            if (key === "driver_name") {
              setSortOrder(order);
            }
          }}
          onLimitChange={() => {}}
        />
        </div>
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}

      {editForm && (
        <div className="modalOverlay">
          <div className="nicModal large">
            <div className="nicModalHeader">
              <h3>Edit Duty</h3>
              <button onClick={() => {setEditForm(null); setFormErrors({});}}>
                <X />
              </button>
            </div>

            <div className="editForm space-y-4">
              <label>
                Shift
                <select
                  value={editForm.shift ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shift: e.target.value as any })
                  }
                  onBlur={() => validateSingleField(driverDutyEditSchema, "shift", editForm.shift, setFormErrors)}
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="night">Night</option>
                </select>
                <p className="errorText">{formErrors.shift}</p>
              </label>

              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={editForm.is_week_off}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      is_week_off: e.target.checked,
                      repeat_weekly: e.target.checked ? editForm.repeat_weekly : false,
                      ...(e.target.checked
                        ? { duty_in_time: null, duty_out_time: null }
                        : {}),
                    })
                  }
                  onBlur={() => validateSingleField(driverDutyEditSchema, "week_off", editForm.is_week_off, setFormErrors)}
                />
                Week Off
                <p className="errorText">{formErrors.week_off}</p>
              </label>
              {editForm.is_week_off && (
                <label className="flex gap-2 items-center ml-6">
                  <input
                    type="checkbox"
                    checked={editForm.repeat_weekly ?? false}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        repeat_weekly: e.target.checked,
                      })
                    }
                  />
                  Repeat every week
                </label>
              )}

              {!editForm.is_week_off && (
                <>
                  {/* <input
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
                  /> */}

                  <TimePicker12h
                    label="Duty In Time"
                    name="duty_in_time"
                    value={editForm.duty_in_time ?? undefined}
                    onChange={(value) =>
                      setEditForm({ ...editForm, duty_in_time: value })
                    }
                    onBlur={() => validateSingleField(driverDutyEditSchema, "duty_in_time", editForm.duty_in_time, setFormErrors)}

                  />
                  <p className="errorText">{formErrors.duty_in_time}</p>


                  <TimePicker12h
                    label="Duty Out Time"
                    name="duty_out_time"
                    value={editForm.duty_out_time ?? undefined}
                    onChange={(value) =>
                      setEditForm({ ...editForm, duty_out_time: value })
                    }
                    onBlur={() => validateSingleField(driverDutyEditSchema, "duty_out_time", editForm.duty_out_time, setFormErrors)}

                  />
                  <p className="errorText">{formErrors.duty_out_time}</p>
                </>
              )}
            </div>

            <div className="nicModalActions">
              <button className="saveBtn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
