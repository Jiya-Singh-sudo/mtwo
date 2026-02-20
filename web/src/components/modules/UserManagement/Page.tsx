import { Plus, Edit, Trash2, X, Users, CheckCircle } from "lucide-react";
import "./UserManagement.css";
import { useEffect, useState } from "react";
import type { Role } from "@/types/userManagement.types";
import { getActiveUsers, createUser, updateUser, softDeleteUser, getActiveRoles } from "@/api/authentication/users.api";
import { useAuth } from "@/context/AuthContext";
import { Column, DataTable } from "@/components/ui/DataTable";
import { useTableQuery } from "@/hooks/useTableQuery";
import { StatCard } from "@/components/ui/StatCard";
import { validateSingleField } from "@/utils/validateSingleField";
import { FieldError } from "@/components/ui/FieldError";
import { userCreateSchema, userUpdateSchema } from "@/validation/user.validation";

/* ======================================================
   Types – mapped to m_User table
====================================================== */
interface User {
  id: string; // frontend key
  username: string; // username
  fullName: string;
  role_id: string;
  primary_mobile?: string;
  alternate_mobile?: string;
  email?: string;
  address?: string;
}

/* ======================================================
   Component
====================================================== */
export default function UserManagement() {
  /* ---------------- STATE ---------------- */
  const [users, setUsers] = useState<User[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    primary_mobile: "",
    alternate_mobile: "",
    email: "",
    password: "",
    address: "",
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
      primary_mobile: "",
      alternate_mobile: "",
      email: "",
      password: "",
      address: "",
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
    if (
      form.primary_mobile.trim() !== "" &&
      !/^\d{10}$/.test(form.primary_mobile.trim())
    ) {
      alert("Mobile number must be 10 digits");
      return false;
    }
    if (!form.email.trim()) {
      alert("Email is required");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      alert("Invalid email format");
      return false;
    }
    return true;
  };

  useEffect(() => {
    async function loadUsers() {
      userTable.setLoading(true);

      try {
        const res = await getActiveUsers(userTable.query);

        // Defensive handling
        const rows = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        const mapped = rows.map((u: any) => ({
          id: u.user_id,
          username: u.username,
          fullName: u.full_name ?? "",
          role_id: u.role_id,
          primary_mobile: u.primary_mobile ?? "",
          alternate_mobile: u.alternate_mobile ?? "",
          email: u.email ?? "",
          address: u.address ?? "",
        }));

        setUsers(mapped);
        userTable.setTotal(res?.totalCount ?? rows.length ?? 0);

      } catch (err) {
        console.error("Failed to load users", err);
        setUsers([]);
        userTable.setTotal(0);
      } finally {
        userTable.setLoading(false);
      }
    }
    loadUsers();
  }, [userTable.query]);

  // useEffect(() => {
  //   async function loadUsers() {
  //     userTable.setLoading(true);
  //     try {
  //       const res = await getActiveUsers(userTable.query);
  //       // Map based on the response structure { data: [], totalCount: number }
  //       const mapped = res.data.map((u: any) => ({
  //         id: u.user_id,
  //         username: u.username,
  //         fullName: u.full_name,
  //         role_id: u.role_id,
  //         primary_mobile: u.user_primary_mobile,
  //         email: u.email,
  //       }));

  //       setUsers(mapped);
  //       userTable.setTotal(res.totalCount);
  //     } finally {
  //       userTable.setLoading(false);
  //     }
  //   }

  //   loadUsers();
  // }, [userTable.query]);

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
      email: form.email.trim(),
      primary_mobile:
        form.primary_mobile.trim() !== ""
          ? Number(form.primary_mobile.trim())
          : undefined,
      alternate_mobile:
        form.alternate_mobile.trim() !== ""
          ? Number(form.alternate_mobile.trim())
          : undefined,
      address: form.address || undefined,
    };

    await createUser(payload);

    // Reload table to properly handle pagination/sorting update
    userTable.batchUpdate(prev => ({
      ...prev,
      page: 1
    }));

    setIsAddOpen(false);
    resetForm();
  }

  async function editUser() {
    if (!selectedUser || !validate(true)) return;

    const payload = {
      username: form.username,
      full_name: form.fullName,
      role_id: form.role_id,
      email: form.email.trim(),
      primary_mobile:
        form.primary_mobile.trim() !== ""
          ? Number(form.primary_mobile.trim())
          : undefined,

      alternate_mobile:
        form.alternate_mobile.trim() !== ""
          ? Number(form.alternate_mobile.trim())
          : undefined,
      address: form.address || undefined,
    };

    await updateUser(selectedUser.username, payload);

    // Reload table or update local state if we want to be optimistic
    // Ideally reload for consistent sort/filter
    userTable.batchUpdate(prev => ({
      ...prev,
      page: 1
    }));

    setIsEditOpen(false);
    setSelectedUser(null);
    resetForm();
  }


  async function deleteUser() {
    if (!selectedUser) return;

    await softDeleteUser(selectedUser.username);

    // Refresh table
    userTable.batchUpdate(prev => ({
      ...prev,
      page: 1
    }));

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
                  primary_mobile: row.primary_mobile ?? "",
                  alternate_mobile: row.alternate_mobile ?? "",
                  email: row.email ?? "",
                  password: "",
                  address: row.address ?? "",
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
            maxLength={100}
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
                <label>Username <span className="required">*</span></label>
                <input
                  className="nicInput"
                  autoComplete="username"
                  value={form.username}
                  maxLength={30}
                  onBlur={(e) => validateSingleField(userCreateSchema, "username", form.username, setFormErrors)}
                  onChange={(e) =>
                    {
                      validateSingleField(userCreateSchema, "username", e.target.value, setFormErrors);
                      setForm({ ...form, username: e.target.value })
                    }
                  }
                />
                <FieldError message={formErrors.username} />
              </div>

              <div>
                <label>Full Name <span className="required">*</span></label>
                <input
                  className="nicInput"
                  value={form.fullName}
                  onBlur={(e) => validateSingleField(userCreateSchema, "full_name", form.fullName, setFormErrors)}
                  onChange={(e) =>
                    {
                      validateSingleField(userCreateSchema, "full_name", e.target.value, setFormErrors);
                      setForm({ ...form, fullName: e.target.value })
                    }
                  }
                />
                <FieldError message={formErrors.full_name} />
              </div>


              <div>
                <label>Email <span className="required">*</span></label>
                <input
                  className="nicInput"
                  value={form.email}
                  onBlur={(e) => validateSingleField(userCreateSchema, "email", form.email, setFormErrors)}
                  onChange={(e) =>
                    {
                      validateSingleField(userCreateSchema, "email", e.target.value, setFormErrors);
                      setForm({ ...form, email: e.target.value })
                    }
                  }
                />
                <FieldError message={formErrors.email} />
              </div>

              <div>
                <label>Mobile <span className="required">*</span></label>
                <input
                  className="nicInput"
                  value={form.primary_mobile}
                  onBlur={(e) => validateSingleField(userCreateSchema, "user_mobile", form.primary_mobile, setFormErrors)}
                  onChange={(e) =>
                    {
                      validateSingleField(userCreateSchema, "user_mobile", e.target.value, setFormErrors);
                      setForm({ ...form, primary_mobile: e.target.value })
                    }
                  }
                />
                <FieldError message={formErrors.user_mobile} />
              </div>
              <div>
                <label>Alternate Mobile</label>
                <input
                  className="nicInput"
                  value={form.alternate_mobile}
                  onBlur={(e) => validateSingleField(userCreateSchema, "user_alternate_mobile", form.alternate_mobile, setFormErrors)}
                  onChange={(e) =>
                    {
                      validateSingleField(userCreateSchema, "user_alternate_mobile", e.target.value, setFormErrors);
                      setForm({ ...form, alternate_mobile: e.target.value })
                    }
                  }
                />
                <FieldError message={formErrors.user_alternate_mobile} />
              </div>

              {!isEditOpen && (
                <div>
                  <label>Password <span className="required">*</span></label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="nicInput"
                    value={form.password}
                    onBlur={(e) => validateSingleField(userCreateSchema, "password", form.password, setFormErrors)}
                    onChange={(e) =>
                      {
                        validateSingleField(userCreateSchema, "password", e.target.value, setFormErrors);
                        setForm({ ...form, password: e.target.value })
                      }
                    }
                  />
                </div>
              )}

              <div>
                <label>Role <span className="required">*</span></label>
                <select
                  className="nicInput"
                  value={form.role_id}
                  onBlur={(e) => validateSingleField(userCreateSchema, "role_id", form.role_id, setFormErrors)}
                  onChange={(e) =>
                    {
                      validateSingleField(userCreateSchema, "role_id", e.target.value, setFormErrors);
                      setForm({ ...form, role_id: e.target.value })
                    }
                  }
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
                <FieldError message={formErrors.role_id} />
              </div>
              <div>
                <label>Address</label>
                <input
                  className="nicInput"
                  value={form.address}
                  onBlur={(e) => validateSingleField(userCreateSchema, "address", form.address, setFormErrors)}
                  onChange={(e) =>
                    {
                      validateSingleField(userCreateSchema, "address", e.target.value, setFormErrors);
                      setForm({ ...form, address: e.target.value })
                    }
                  }
                />
                <FieldError message={formErrors.address} />
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
