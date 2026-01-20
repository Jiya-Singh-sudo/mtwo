import { Plus, Edit, Trash2, X } from "lucide-react";
import "./UserManagement.css";
import { useEffect, useState } from "react";
import type { Role } from "@/types/userManagement.types";
import { getActiveUsers, createUser, updateUser, softDeleteUser, getActiveRoles } from "@/api/authentication/users.api";
import { useAuth } from "@/context/AuthContext";


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
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      try {
        const data = await getActiveUsers();
        setUsers(
          data.map((u) => ({
            id: u.user_id,
            username: u.username,
            fullName: u.full_name,
            role_id: u.role_id,
            mobile: u.user_mobile,
            email: u.email,
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);
  
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

    const created = await createUser(payload);

    setUsers((prev) => [
      ...prev,
      {
        id: created.user_id,
        username: created.username,
        fullName: created.full_name,
        role_id: created.role_id,
        email: created.email,
        mobile: created.user_mobile,
      },
    ]);

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

    const updated = await updateUser(selectedUser.username, payload);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              username: updated.username,
              fullName: updated.full_name,
              role_id: updated.role_id,
              email: updated.email,
              mobile: updated.user_mobile,
            }
          : u
      )
    );

    setIsEditOpen(false);
    setSelectedUser(null);
    resetForm();
  }


  async function deleteUser() {
    if (!selectedUser) return;

    await softDeleteUser(selectedUser.username);

    setUsers((prev) =>
      prev.filter((u) => u.id !== selectedUser.id)
    );

    setIsDeleteOpen(false);
    setSelectedUser(null);
  }


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

      {/* TABLE */}
      <div className="bg-white border rounded-sm">
        <table className="w-full">
          <thead className="bg-[#F5A623] text-white">
            <tr>
              <th className="px-4 py-3 text-left">User ID</th>
              <th className="px-4 py-3 text-left">Name & Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={i % 2 ? "bg-gray-50" : ""}>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">
                  <p>{u.fullName}</p>
                  <p className="subText">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="statusPill">
                    {roles.find((r) => r.role_id === u.role_id)?.role_name ?? u.role_id}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {hasPermission("user.update") && (
                    <button
                      className="actionBtn"
                      onClick={() => {
                        setSelectedUser(u);
                        setForm({
                          username: u.username,
                          fullName: u.fullName,
                          role_id: u.role_id,
                          mobile: u.mobile ?? "",
                          email: u.email ?? "",
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
                      className="actionBtn delete"
                      onClick={() => {
                        setSelectedUser(u);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
