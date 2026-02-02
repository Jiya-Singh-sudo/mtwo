import { Plus, Edit, Trash2, X, Users, CheckCircle } from "lucide-react";
import "./UserManagement.css";
import { useEffect, useState } from "react";
import type { Role } from "@/types/userManagement.types";
import { getActiveUsers, createUser, updateUser, softDeleteUser, getActiveRoles } from "@/api/authentication/users.api";
import { useAuth } from "@/context/AuthContext";
import { Column, DataTable } from "@/components/ui/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { StatCard } from "@/components/ui/StatCard";

/* ======================================================
   Types – mapped to m_User table
====================================================== */
interface User {
  id: string; // frontend key
  username: string; // username
  fullName: string;
  role_id: string;
  mobile?: string;
  email?: string;
}

/* ======================================================
   Component
====================================================== */
export default function UserManagement() {
  /* ---------------- STATE ---------------- */
  const [users, setUsers] = useState<User[]>([]);
  // const [loading, setLoading] = useState(false); // Handled by userTable

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { hasPermission } = useAuth();

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    role_id: "",
    mobile: "",
    email: "",
    password: "",
  });

  const [roles, setRoles] = useState<Role[]>([]);

  const userTable = useTableQuery({
    prefix: "users",
    sortBy: "username",
    sortOrder: "asc",
    limit: 10,
  });

  /* ---------------- HELPERS ---------------- */
  const resetForm = () =>
    setForm({
      username: "",
      fullName: "",
      role_id: "",
      mobile: "",
      email: "",
      password: "",
    });

  const validate = (isEdit = false) => {
    if (!form.username || !form.fullName || !form.role_id) {
      alert("Username, Full Name and Role are required");
      return false;
    }
    if (!isEdit && !form.password) {
      alert("Password is required");
      return false;
    }
    if (form.mobile && !/^\d{10}$/.test(form.mobile)) {
      alert("Mobile number must be 10 digits");
      return false;
    }
    return true;
  };

  useEffect(() => {
    async function loadUsers() {
      userTable.setLoading(true);
      try {
        const res = await getActiveUsers(userTable.query);
        // Map based on the response structure { data: [], totalCount: number }
        const mapped = res.data.map((u: any) => ({
          id: u.user_id,
          username: u.username,
          fullName: u.full_name,
          role_id: u.role_id,
          mobile: u.user_mobile,
          email: u.email,
        }));

        setUsers(mapped);
        userTable.setTotal(res.totalCount);
      } finally {
        userTable.setLoading(false);
      }
    }

    loadUsers();
  }, [userTable.query]);

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await getActiveRoles();
        setRoles(data);
      } catch (err) {
        console.error("Failed to load roles", err);
      }
    }

    loadRoles();
  }, []);


  /* ---------------- ACTIONS ---------------- */
  async function addUser() {
    if (!validate()) return;

    const payload = {
      username: form.username,
      full_name: form.fullName,
      role_id: form.role_id,
      password: form.password,
      email: form.email || undefined,
      user_mobile: form.mobile ? Number(form.mobile) : undefined,
    };

    await createUser(payload);

    // Reload table to properly handle pagination/sorting update
    userTable.setPage(1);

    setIsAddOpen(false);
    resetForm();
  }


  async function editUser() {
    if (!selectedUser || !validate(true)) return;

    const payload = {
      username: form.username,
      full_name: form.fullName,
      role_id: form.role_id,
      email: form.email || undefined,
      user_mobile: form.mobile ? Number(form.mobile) : undefined,
    };

    await updateUser(selectedUser.username, payload);

    // Reload table or update local state if we want to be optimistic
    // Ideally reload for consistent sort/filter
    userTable.setPage(1); // Or keep current page: setPage(userTable.query.page)

    setIsEditOpen(false);
    setSelectedUser(null);
    resetForm();
  }


  async function deleteUser() {
    if (!selectedUser) return;

    await softDeleteUser(selectedUser.username);

    // Refresh table
    userTable.setPage(1);

    setIsDeleteOpen(false);
    setSelectedUser(null);
  }

  /* ---------------- COLUMNS ---------------- */
  const userColumns: Column<User>[] = [
    {
      header: "User ID",
      accessor: "username",
      sortable: true,
      sortKey: "username",
    },
    {
      header: "Name & Email",
      render: (row) => (
        <div>
          <p>{row.fullName}</p>
          <p className="subText">{row.email}</p>
        </div>
      ),
    },
    {
      header: "Role",
      render: (row) => (
        <span className="statusPill">
          {roles.find((r) => r.role_id === row.role_id)?.role_name ?? row.role_id}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-3">
          {hasPermission("user.update") && (
            <button
              className="icon-btn text-green-600"
              title="Edit"
              onClick={() => {
                setSelectedUser(row);
                setForm({
                  username: row.username,
                  fullName: row.fullName,
                  role_id: row.role_id,
                  mobile: row.mobile ?? "",
                  email: row.email ?? "",
                  password: "",
                });
                setIsEditOpen(true);
              }}
            >
              <Edit size={16} />
            </button>
          )}

          {hasPermission("user.delete") && (
            <button
              className="icon-btn text-red-600"
              title="Delete"
              onClick={() => {
                setSelectedUser(row);
                setIsDeleteOpen(true);
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];


  /* ======================================================
     UI
====================================================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">User Management</h2>
          <p className="text-sm text-gray-600">
            Manage system users and roles | उपयोगकर्ता प्रबंधन
          </p>
        </div>
        {/* Header action button moved to search bar area usually, but keeping here if preferred or...
            Wait, instructions said "Search + Add Bar" - checking Step 101.
            Step 101: "Step 2 — You already added the correct Search + Add bar... Leave it."
            But in the current file view (Step 139), I see standard header with Add button, NO Search bar.
            I must have missed that "You already added..." part because I reverted files or the user reverted files.
            I will re-add the Search + Add bar structure as per Transport style.
         */}
      </div>

      {/* STAT CARDS */}
      <div className="statsGrid">
        <div className="statCard blue">
          <div className="statIcon blue">
            <Users />
          </div>
          <div className="statContent">
            <p className="statLabel">Total Users</p>
            <h3 className="statValue">{userTable.total}</h3>
          </div>
        </div>

        <div className="statCard green">
          <div className="statIcon green">
            <CheckCircle />
          </div>
          <div className="statContent">
            <p className="statLabel">Active Roles</p>
            <h3 className="statValue">{roles.length}</h3>
          </div>
        </div>
      </div>

      {/* SEARCH + ADD BAR */}
      <div className="bg-white border rounded-sm p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          {/* Simple Input for now, or match Transport search */}
          <input
            className="pl-3 pr-3 py-2 w-full border rounded-sm"
            placeholder="Search username or name..."
            value={userTable.searchInput}
            onChange={(e) => userTable.setSearchInput(e.target.value)}
          />
        </div>

        {hasPermission("user.create") && (
          <button
            className="nicPrimaryBtn"
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
          >
            <Plus size={16} /> Add New User
          </button>
        )}
      </div>

      {/* DATATABLE */}
      <div className="bg-white border rounded-sm">
        <DataTable
          data={users}
          columns={userColumns}
          keyField="id"

          page={userTable.query.page}
          limit={userTable.query.limit}
          totalCount={userTable.total}

          sortBy={userTable.query.sortBy}
          sortOrder={userTable.query.sortOrder}
          loading={userTable.loading}

          onPageChange={userTable.setPage}
          onLimitChange={userTable.setLimit}
          onSortChange={userTable.setSort}
        />
      </div>

      {/* ADD / EDIT MODAL */}
      {(isAddOpen || isEditOpen) && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>{isAddOpen ? "Add New User" : "Edit User"}</h2>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                  resetForm();
                }}
              >
                <X />
              </button>
            </div>

            <div className="nicForm">
              <div>
                <label>Username *</label>
                <input
                  className="nicInput"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Full Name *</label>
                <input
                  className="nicInput"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />
              </div>


              <div>
                <label>Email</label>
                <input
                  className="nicInput"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Mobile</label>
                <input
                  className="nicInput"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm({ ...form, mobile: e.target.value })
                  }
                />
              </div>

              {!isEditOpen && (
                <div>
                  <label>Password *</label>
                  <input
                    type="password"
                    className="nicInput"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </div>
              )}

              <div>
                <label>Role *</label>
                <select
                  className="nicInput"
                  value={form.role_id}
                  onChange={(e) =>
                    setForm({ ...form, role_id: e.target.value })
                  }
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => {
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className="saveBtn"
                onClick={isAddOpen ? addUser : editUser}
              >
                {isAddOpen ? "Add User" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {isDeleteOpen && (
        <div className="modalOverlay">
          <div className="nicModal">
            <h3>Delete User?</h3>
            <p className="subText">This action cannot be undone.</p>

            <div className="nicModalActions">
              <button
                className="cancelBtn"
                onClick={() => setIsDeleteOpen(false)}
              >
                Cancel
              </button>
              <button className="saveBtn" onClick={deleteUser}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
