import { useEffect, useMemo, useState } from "react";
import styles from "./RolePage.module.css";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole as apiDeleteRole,
} from "../../services/rolesApi";

interface Role {
  role_id: string;
  role_name: string;
  role_desc: string;
  is_active: boolean;
  inserted_at: string;
  inserted_by: string;
  inserted_ip: string;
  updated_at: string;
  updated_by: string;
  updated_ip: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // fetch roles
  async function loadRoles() {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  // reset page when search or pagesize changes
  useEffect(() => setPage(1), [search, pageSize]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) =>
      (r.role_name || "").toLowerCase().includes(q) ||
      (r.role_desc || "").toLowerCase().includes(q) ||
      (r.inserted_by || "").toLowerCase().includes(q) ||
      (r.updated_by || "").toLowerCase().includes(q) ||
      (r.inserted_ip || "").toLowerCase().includes(q) ||
      (r.updated_ip || "").toLowerCase().includes(q)
    );
  }, [roles, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(total, startIndex + pageSize);
  const pageItems = filtered.slice(startIndex, endIndex);

  function goTo(newPage: number) {
    const p = Math.max(1, Math.min(totalPages, newPage));
    setPage(p);
    // scroll to table top for better UX
    const el = document.querySelector(`.${styles.tableWrap}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Create
  async function handleCreate(payload: { role_name: string; role_desc: string }) {
    try {
      setLoading(true);
      const created = await createRole(payload);
      // append created to top
      setRoles((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setPage(1);
    } catch (err: any) {
      alert(err?.message ?? "Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  // Edit / Update
  async function saveEdit(updated: Role) {
    try {
      setLoading(true);
      const saved = await updateRole(updated.role_id, {
        role_name: updated.role_name,
        is_active: updated.is_active,
      });
      setRoles((prev) => prev.map((r) => (r.role_id === saved.role_id ? saved : r)));
      setRoleToEdit(null);
    } catch (err: any) {
      alert(err?.message ?? "Failed to update role");
    } finally {
      setLoading(false);
    }
  }

  // Soft-delete
  async function confirmAndDelete() {
    if (!roleToDelete) return;
    try {
      setLoading(true);
      await apiDeleteRole(roleToDelete.role_id);
      // remove from active view
      setRoles((prev) => prev.filter((r) => r.role_id !== roleToDelete.role_id));
      setRoleToDelete(null);
    } catch (err: any) {
      alert(err?.message ?? "Failed to delete role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Roles</h1>
          <p className={styles.subtitle}>Manage system roles & permissions</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.addBtn}
            onClick={() => setShowCreateModal(true)}
            aria-label="Create Role"
          >
            + Create Role
          </button>
        </div>
      </header>

      <div className={styles.controlsRow}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search roles by name, description, user or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className={styles.rightControls}>
          <label className={styles.pageSizeLabel}>
            Show
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={styles.pageSizeSelect}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            / page
          </label>
        </div>
      </div>

      <div className={`card ${styles.tableWrap}`}>
        {loading && <div className={styles.loading}>Loading…</div>}
        {error && <div className={styles.error}>Error: {error}</div>}

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Role</th>
                <th>Description</th>
                <th>Active</th>
                <th>Inserted At</th>
                <th>Inserted By</th>
                <th>Inserted IP</th>
                <th>Updated At</th>
                <th>Updated By</th>
                <th>Updated IP</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {pageItems.map((r) => (
                <tr key={r.role_id}>
                  <td className={styles.mono}>{r.role_id}</td>
                  <td>{r.role_name}</td>
                  <td>{r.role_desc}</td>
                  <td>{r.is_active ? "Yes" : "No"}</td>
                  <td>{r.inserted_at ? new Date(r.inserted_at).toLocaleString() : "—"}</td>
                  <td>{r.inserted_by ?? "—"}</td>
                  <td className={styles.mono}>{r.inserted_ip ?? "—"}</td>
                  <td>{r.updated_at ? new Date(r.updated_at).toLocaleString() : "—"}</td>
                  <td>{r.updated_by ?? "—"}</td>
                  <td className={styles.mono}>{r.updated_ip ?? "—"}</td>
                  <td className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => setRoleToEdit(r)}>
                      Edit
                    </button>
                    <button className={styles.deleteBtn} onClick={() => setRoleToDelete(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {pageItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} className={styles.noResults}>
                    No matching roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* footer / pagination */}
      <div className={styles.footerRow}>
        <div className={styles.countText}>
          {total === 0 ? "No roles." : `Showing ${startIndex + 1}–${endIndex} of ${total} roles`}
        </div>

        <div className={styles.pagination}>
          <button className={styles.pagerBtn} disabled={page <= 1} onClick={() => goTo(page - 1)}>
            Prev
          </button>

          <span className={styles.pageNumber}>
            {page} / {totalPages}
          </span>

          <button
            className={styles.pagerBtn}
            disabled={page >= totalPages}
            onClick={() => goTo(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* DELETE MODAL */}
      {roleToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Remove role from view?</h3>
            <p>
              This will mark <strong>{roleToDelete.role_name}</strong> as inactive (soft delete).
            </p>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setRoleToDelete(null)}>
                Cancel
              </button>
              <button className={styles.deleteBtn} onClick={confirmAndDelete}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {roleToEdit && (
        <EditModal
          role={roleToEdit}
          onCancel={() => setRoleToEdit(null)}
          onSave={saveEdit}
        />
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <CreateModal
          onCancel={() => setShowCreateModal(false)}
          onSave={(payload) => handleCreate(payload)}
        />
      )}
    </div>
  );
}

/* ---------------- Edit Modal Component ---------------- */

function EditModal({
  role,
  onCancel,
  onSave,
}: {
  role: Role;
  onCancel: () => void;
  onSave: (r: Role) => void;
}) {
  const [form, setForm] = useState(role);

  function update(field: keyof Role, value: any) {
    setForm({ ...form, [field]: value });
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Edit Role</h3>

        {/* ROLE NAME */}
        <label className={styles.modalLabel}>Role Name</label>
        <input
          className={styles.modalInput}
          value={form.role_name}
          onChange={(e) => update("role_name", e.target.value)}
        />

        {/* REMOVED DESCRIPTION SECTION */}

        {/* ACTIVE FIELD */}
        <label className={styles.modalLabel}>Active</label>
        <select
          className={styles.modalInput}
          value={form.is_active ? "1" : "0"} // Convert boolean/number to string "1" or "0"
          onChange={(e) => update("is_active", Number(e.target.value))}
        >
          <option value={1}>Active</option>
          <option value={0}>Inactive</option>
        </select>

        {/* ACTION BUTTONS */}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={() => onSave(form)}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}


/* ---------------- Create Modal Component ---------------- */

function CreateModal({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (data: { role_name: string; role_desc: string }) => void;
}) {
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!roleName.trim()) {
      alert("Role name is required");
      return;
    }
    setSaving(true);
    try {
      await onSave({ role_name: roleName.trim(), role_desc: roleDesc.trim() });
      setRoleName("");
      setRoleDesc("");
    } catch (err: any) {
      alert(err?.message ?? "Failed to create role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Create New Role</h3>

        <label className={styles.modalLabel}>Role Name</label>
        <input
          className={styles.modalInput}
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          placeholder="Enter role name"
        />

        <label className={styles.modalLabel}>Description</label>
        <input
          className={styles.modalInput}
          value={roleDesc}
          onChange={(e) => setRoleDesc(e.target.value)}
          placeholder="Enter description"
        />

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={submit} disabled={saving}>
            {saving ? "Creating…" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
