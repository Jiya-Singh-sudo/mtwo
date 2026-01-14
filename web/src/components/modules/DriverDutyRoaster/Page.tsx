import { useEffect, useState } from "react";
import { Clock, Edit, X } from "lucide-react";
import { getDriverDutiesByRange, updateDriverDuty, createDriverDuty } from "../../../api/driverDuty.api";
import { DriverDuty, DriverWeeklyRow } from "@/types/driverDuty";
import "./DriverDutyRoaster.css";
import { DataTable, type Column } from "@/components/ui/DataTable";
import React from "react";

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
  const date = new Date(y, m - 1, d); // LOCAL date
  date.setDate(date.getDate() + dayIndex);
  return date.toISOString().slice(0, 10);
}


export default function DriverDutyRoasterPage() {
  /* ================= STATE ================= */

  const [rosters, setRosters] = useState<DriverWeeklyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<DriverDuty | null>(null);
  const [saving, setSaving] = useState(false);

  const [weekStartDate, setWeekStartDate] = useState<string>(() => {
    const today = new Date();
    const day = today.getDay() || 7;
    today.setDate(today.getDate() - day + 1);
    return today.toISOString().slice(0, 10);
  });

  /* ================= LOAD DATA ================= */

  const load = async () => {
    try {
      setLoading(true);
      const from = weekStartDate;
      const to = getDateForDay(weekStartDate, 6);

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
          const dateKey = d.duty_date.slice(0, 10);
          grouped[d.driver_id].duties[dateKey] = d;
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

  const tableData: DriverDutyTableRow[] = rosters.map((row) => {
    const dates = [0, 1, 2, 3, 4, 5, 6].map((i) =>
      getDateForDay(weekStartDate, i)
    );

    const cells = dates.map((date) => {
      const duty = row.duties[date];

      return (
        <div className={`dayCell ${duty ? "hasDuty" : ""} ${duty?.is_week_off ? "weekOff" : ""}`}>
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
                }
              )
            }
          >
            <Edit size={14} />
          </button>
        </div>
      );
    });

    return {
      driver_id: row.driver_id,
      driver_name: row.driver_name ?? "",
      mon: cells[0],
      tue: cells[1],
      wed: cells[2],
      thu: cells[3],
      fri: cells[4],
      sat: cells[5],
      sun: cells[6],
    };
  });

  function shiftWeek(weekStart: string, days: number) {
    const [y, m, d] = weekStart.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return date.toISOString().slice(0, 10);
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
        });
      }

      setEditForm(null);
      await load();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save duty");
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
  const sortOrder: "asc" | "desc" = "asc";

  const driverColumns: Column<DriverDutyTableRow>[] = [
    {
      header: "Driver Name",
      accessor: "driver_name",
    },
    {
      header: "Mon",
      accessor: "mon",
      cell: ({ value }) => value,
    },
    {
      header: "Tue",
      accessor: "tue",
      cell: ({ value }) => value,
    },
    {
      header: "Wed",
      accessor: "wed",
      cell: ({ value }) => value,
    },
    {
      header: "Thu",
      accessor: "thu",
      cell: ({ value }) => value,
    },
    {
      header: "Fri",
      accessor: "fri",
      cell: ({ value }) => value,
    },
    {
      header: "Sat",
      accessor: "sat",
      cell: ({ value }) => value,
    },
    {
      header: "Sun",
      accessor: "sun",
      cell: ({ value }) => value,
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
          onSortChange={() => {}}
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
              <button onClick={() => setEditForm(null)}>
                <X />
              </button>
            </div>

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
