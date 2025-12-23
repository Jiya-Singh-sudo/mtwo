'use client';
import { useState } from "react";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  X,
  Plus,
} from "lucide-react";

interface RosterItem {
  department: string;
  officer: string;
  duty: string;
  time: string;
  status: "Active" | "Pending";
  approval: "Approved" | "Pending";
}

type FilterType = "ALL" | "ACTIVE" | "PENDING";

export function DutyRoster() {
  /* ---------------- STATE ---------------- */

  const [roster, setRoster] = useState<RosterItem[]>([
    {
      department: "Housekeeping",
      officer: "Ramesh Kumar",
      duty: "Room Cleaning - Floor 1",
      time: "08:00 - 16:00",
      status: "Active",
      approval: "Approved",
    },
    {
      department: "Security",
      officer: "Vijay Singh",
      duty: "Main Gate Security",
      time: "00:00 - 08:00",
      status: "Active",
      approval: "Approved",
    },
    {
      department: "Kitchen",
      officer: "Sita Devi",
      duty: "Meal Preparation",
      time: "06:00 - 14:00",
      status: "Active",
      approval: "Approved",
    },
    {
      department: "Front Desk",
      officer: "Amit Sharma",
      duty: "Guest Reception",
      time: "08:00 - 20:00",
      status: "Pending",
      approval: "Pending",
    },
  ]);

  /* 🔹 FILTER STATE */
  const [filter, setFilter] = useState<FilterType>("ALL");

  const officersByDepartment: Record<string, string[]> = {
    Housekeeping: ["Ramesh Kumar", "Suresh Yadav"],
    Security: ["Vijay Singh", "Anil Verma"],
    Kitchen: ["Sita Devi", "Pooja Sharma"],
    "Front Desk": ["Amit Sharma", "Neha Gupta"],
    Maintenance: ["Rohit Meena"],
  };

  const [builderForm, setBuilderForm] = useState({
    department: "",
    officer: "",
    time: "",
  });

  const [selectedRoster, setSelectedRoster] = useState<RosterItem | null>(null);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [editForm, setEditForm] = useState({
    department: "",
    officer: "",
    time: "",
  });

  /* ---------------- ACTIONS ---------------- */

  function addToRoster() {
    if (!builderForm.department || !builderForm.officer || !builderForm.time) {
      alert("Please fill all fields");
      return;
    }

    setRoster((prev) => [
      ...prev,
      {
        department: builderForm.department,
        officer: builderForm.officer,
        duty: `${builderForm.department} Duty`,
        time: builderForm.time,
        status: "Pending",
        approval: "Pending",
      },
    ]);

    setBuilderForm({ department: "", officer: "", time: "" });
    setShowAdd(false);
  }

  function approvePending() {
    setRoster((prev) =>
      prev.map((r) =>
        r.approval === "Pending"
          ? { ...r, approval: "Approved", status: "Active" }
          : r
      )
    );
  }

  function openView(item: RosterItem) {
    setSelectedRoster(item);
    setShowView(true);
  }

  function openEdit(item: RosterItem) {
    setSelectedRoster(item);
    setEditForm({
      department: item.department,
      officer: item.officer,
      time: item.time,
    });
    setShowEdit(true);
  }

  function saveEdit() {
    if (!selectedRoster) return;

    setRoster((prev) =>
      prev.map((r) =>
        r === selectedRoster
          ? {
            ...r,
            department: editForm.department,
            officer: editForm.officer,
            time: editForm.time,
            duty: `${editForm.department} Duty`,
          }
          : r
      )
    );

    setShowEdit(false);
  }

  function openDelete(item: RosterItem) {
    setSelectedRoster(item);
    setShowDelete(true);
  }

  function confirmDelete() {
    if (!selectedRoster) return;
    setRoster((prev) => prev.filter((r) => r !== selectedRoster));
    setShowDelete(false);
  }

  /* ---------------- STATS ---------------- */

  const activeDuties = roster.filter((r) => r.status === "Active").length;
  const pendingApproval = roster.filter((r) => r.approval === "Pending").length;

  /* 🔹 FILTERED DATA */
  const filteredRoster =
    filter === "ALL"
      ? roster
      : filter === "ACTIVE"
        ? roster.filter((r) => r.status === "Active")
        : roster.filter((r) => r.approval === "Pending");

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[#00247D]">Duty Roster Management</h2>
          <p className="text-sm text-gray-600">
            ड्यूटी रोस्टर प्रबंधन – Manage staff duties and schedules
          </p>
        </div>
        <button className="assignBtn" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Duty
        </button>
      </div>

      {/* STATS (CLICKABLE) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Duties"
          value={activeDuties}
          icon={<Users />}
          active={filter === "ACTIVE"}
          onClick={() => setFilter(filter === "ACTIVE" ? "ALL" : "ACTIVE")}
        />
        <StatCard
          label="Pending Approval"
          value={pendingApproval}
          icon={<AlertCircle />}
          active={filter === "PENDING"}
          onClick={() => setFilter(filter === "PENDING" ? "ALL" : "PENDING")}
        />
        <StatCard
          label="Completed Today"
          value={activeDuties}
          icon={<CheckCircle />}
          active={filter === "ACTIVE"}
          onClick={() => setFilter("ACTIVE")}
        />
        <StatCard
          label="Total Staff"
          value={14}
          icon={<Calendar />}
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F5A623] text-white">
            <tr>
              <th className="px-6 py-3 text-left">Department</th>
              <th className="px-6 py-3 text-left">Officer</th>
              <th className="px-6 py-3 text-left">Duty</th>
              <th className="px-6 py-3 text-left">Time</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Approval</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoster.map((r, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{r.department}</td>
                <td className="px-6 py-4">{r.officer}</td>
                <td className="px-6 py-4">{r.duty}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {r.time}
                </td>
                <td className="px-6 py-4">{r.status}</td>
                <td className="px-6 py-4">{r.approval}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openView(r)} className="icon-btn text-blue-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(r)} className="icon-btn text-green-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => openDelete(r)} className="icon-btn text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* APPROVAL */}
      {pendingApproval > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
          <p>{pendingApproval} duties pending approval</p>
          <button
            onClick={approvePending}
            className="mt-2 bg-orange-600 text-white px-4 py-2"
          >
            Approve All
          </button>
        </div>
      )}

      {/* MODALS */}
      {showAdd && (
        <Modal title="Add New Duty" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <select
              className="border p-2 w-full"
              value={builderForm.department}
              onChange={(e) =>
                setBuilderForm({ ...builderForm, department: e.target.value, officer: "" })
              }
            >
              <option value="">Select Department *</option>
              {Object.keys(officersByDepartment).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              className="border p-2 w-full"
              value={builderForm.officer}
              onChange={(e) =>
                setBuilderForm({ ...builderForm, officer: e.target.value })
              }
            >
              <option value="">Select Officer *</option>
              {builderForm.department &&
                officersByDepartment[builderForm.department].map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
            </select>

            <select
              className="border p-2 w-full"
              value={builderForm.time}
              onChange={(e) =>
                setBuilderForm({ ...builderForm, time: e.target.value })
              }
            >
              <option value="">Select Time *</option>
              <option>00:00 - 08:00</option>
              <option>08:00 - 16:00</option>
              <option>16:00 - 00:00</option>
            </select>

            <div className="modalActions">
              <button onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="saveBtn" onClick={addToRoster}>
                Add Duty
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODALS (UNCHANGED) */}
      {showView && selectedRoster && (
        <Modal title="Duty Details" onClose={() => setShowView(false)}>
          <p><strong>Department:</strong> {selectedRoster.department}</p>
          <p><strong>Officer:</strong> {selectedRoster.officer}</p>
          <p><strong>Duty:</strong> {selectedRoster.duty}</p>
          <p><strong>Time:</strong> {selectedRoster.time}</p>
          <p><strong>Status:</strong> {selectedRoster.status}</p>
          <p><strong>Approval:</strong> {selectedRoster.approval}</p>
        </Modal>
      )}

      {showEdit && selectedRoster && (
        <Modal title="Edit Duty" onClose={() => setShowEdit(false)}>
          <div className="space-y-3">
            <select
              value={editForm.department}
              onChange={(e) =>
                setEditForm({ department: e.target.value, officer: "", time: editForm.time })
              }
              className="border p-2 w-full"
            >
              {Object.keys(officersByDepartment).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            <select
              value={editForm.officer}
              onChange={(e) => setEditForm({ ...editForm, officer: e.target.value })}
              className="border p-2 w-full"
            >
              {officersByDepartment[editForm.department].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>

            <select
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              className="border p-2 w-full"
            >
              <option>00:00 - 08:00</option>
              <option>08:00 - 16:00</option>
              <option>16:00 - 00:00</option>
            </select>

            <div className="modalActions">
              <button onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="saveBtn" onClick={saveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDelete && selectedRoster && (
        <Modal title="Confirm Delete" onClose={() => setShowDelete(false)}>
          <p>
            Are you sure you want to delete duty for{" "}
            <strong>{selectedRoster.officer}</strong>?
          </p>
          <div className="modalActions">
            <button onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="saveBtn bg-red-600" onClick={confirmDelete}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- HELPERS ---------------- */

function StatCard({ label, value, icon, onClick, active }: any) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border-2 rounded-sm p-6 cursor-pointer transition ${active ? "border-[#00247D]" : "border-gray-200"
        }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-3xl">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: any;
  onClose: () => void;
}) {
  return (
    <div className="modalOverlay">
      <div className="modal">
        <div className="nicModalHeader">
          <h3>{title}</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="modalContent">{children}</div>
      </div>
    </div>
  );
}

export default DutyRoster;