import { Plus, Edit, Trash2, X, Users, CheckCircle } from "lucide-react";
import "./UserManagement.css";
import { useEffect, useState } from "react";
import type { Role } from "@/types/userManagement.types";
import { getActiveUsers, createUser, updateUser, softDeleteUser, getActiveRoles } from "@/api/authentication/users.api";
import { useAuth } from "@/context/AuthContext";
import { Column, DataTable } from "@/components/ui/DataTable";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { useTableQuery } from "@/hooks/useTableQuery";
import { validateSingleField } from "@/utils/validateSingleField";
import { FieldError } from "@/components/ui/FieldError";
import { userCreateSchema } from "@/validation/user.validation";
import { useError } from "@/context/ErrorContext";

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
  const { showError, showSuccess } = useError();

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
      showError("Username, Full Name and Role are required");
      return false;
    }
    if (!isEdit && !form.password) {
      showError("Password is required");
      return false;
    }
    if (
      form.primary_mobile.trim() !== "" &&
      !/^\d{10}$/.test(form.primary_mobile.trim())
    ) {
      showError("Mobile number must be 10 digits");
      return false;
    }
    if (!form.email.trim()) {
      showError("Email is required");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      showError("Invalid email format");
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

      } catch (err: any) {
        console.error("Failed to load users", err);
        showError(err?.response?.data?.message || "Failed to load users");
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
      } catch (err: any) {
        console.error("Failed to load roles", err);
        showError(err?.response?.data?.message || "Failed to load roles");
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
      primary_mobile: form.primary_mobile.trim() !== "" ? Number(form.primary_mobile.trim()) : undefined,
      alternate_mobile: form.alternate_mobile.trim() !== "" ? Number(form.alternate_mobile.trim()) : undefined,
      address: form.address || undefined,
    };

    try {
      await createUser(payload);
      userTable.batchUpdate(prev => ({ ...prev, page: 1 }));
      showSuccess("User added successfully");
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Failed to add user:", err);
      showError(err?.response?.data?.message || "Failed to add user");
    }
  }

  async function editUser() {
    if (!selectedUser || !validate(true)) return;
    const payload = {
      username: form.username,
      full_name: form.fullName,
      role_id: form.role_id,
      email: form.email.trim(),
      primary_mobile: form.primary_mobile.trim() !== "" ? Number(form.primary_mobile.trim()) : undefined,
      alternate_mobile: form.alternate_mobile.trim() !== "" ? Number(form.alternate_mobile.trim()) : undefined,
      address: form.address || undefined,
    };

    try {
      await updateUser(selectedUser.username, payload);
      userTable.batchUpdate(prev => ({ ...prev, page: 1 }));
      showSuccess("User updated successfully");
      setIsEditOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (err: any) {
      console.error("Failed to update user:", err);
      showError(err?.response?.data?.message || "Failed to update user");
    }
  }


  async function deleteUser() {
    if (!selectedUser) return;
    try {
      await softDeleteUser(selectedUser.username);
      userTable.batchUpdate(prev => ({ ...prev, page: 1 }));
      showSuccess("User deleted successfully");
      setIsDeleteOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      showError(err?.response?.data?.message || "Failed to delete user");
    }
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
    <PageLayout
      title="User Management"
      subtitle="Manage system users and roles | उपयोगकर्ता प्रबंधन"
      toolbar={
        <PageToolbar
          left={
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <input
                className="pl-3 pr-3 py-2 w-full border rounded-sm nicInput"
                placeholder="Search username or name..."
                value={userTable.searchInput ?? ""}
                maxLength={100}
                onChange={(e) => userTable.setSearchInput(e.target.value)}
              />
            </div>
          }
          right={
            hasPermission("user.create") && (
              <button
                className="bg-[#00247D] hover:bg-[#003399] text-white btn-icon-text h-10 px-4 flex items-center rounded-sm"
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                <Plus size={16} className="mr-2" /> Add New User
              </button>
            )
          }
        />
      }
      stats={
        <>
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
        </>
      }
    >
      {/* DATATABLE */}
      <div className="bg-white border rounded-sm overflow-hidden">
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
                  onBlur={() => validateSingleField(userCreateSchema, "username", form.username, setFormErrors)}
                  onChange={(e) => {
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
                  onBlur={() => validateSingleField(userCreateSchema, "full_name", form.fullName, setFormErrors)}
                  onChange={(e) => {
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
                  onBlur={() => validateSingleField(userCreateSchema, "email", form.email, setFormErrors)}
                  onChange={(e) => {
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
                  onBlur={() => validateSingleField(userCreateSchema, "user_mobile", form.primary_mobile, setFormErrors)}
                  onChange={(e) => {
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
                  onBlur={() => validateSingleField(userCreateSchema, "user_alternate_mobile", form.alternate_mobile, setFormErrors)}
                  onChange={(e) => {
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
                    onBlur={() => validateSingleField(userCreateSchema, "password", form.password, setFormErrors)}
                    onChange={(e) => {
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
                  onBlur={() => validateSingleField(userCreateSchema, "role_id", form.role_id, setFormErrors)}
                  onChange={(e) => {
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
                  onBlur={() => validateSingleField(userCreateSchema, "address", form.address, setFormErrors)}
                  onChange={(e) => {
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
    </PageLayout>
  );
}
