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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [showDescModal, setShowDescModal] = useState(false);
  const [activeDescText, setActiveDescText] = useState<string | null>(null);
  const [activeDescTitle, setActiveDescTitle] = useState<string | null>(null);

  // Load roles
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

  const [showTopBtn, setShowTopBtn] = useState(false);
  // Show / hide Back-to-Top button on scroll
  useEffect(() => {
    function handleScroll() {
      setShowTopBtn(window.scrollY > 300);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to top
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  function goTo(newPage: number) {
    const p = Math.max(1, Math.min(totalPages, newPage));
    setPage(p);

    // Removed scrollIntoView because it jumps the screen downward
    // const el = document.querySelector(`.${styles.tableWrap}`);
    // el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Create
  async function handleCreate(payload: { role_name: string; role_desc: string }) {
    try {
      setLoading(true);
      const created = await createRole(payload);
      setRoles((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setPage(1);
    } catch (err: any) {
      alert(err?.message ?? "Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  // Update
  async function saveEdit(updated: Role) {
    try {
      setLoading(true);
      const saved = await updateRole(updated.role_id, {
        role_name: updated.role_name,
        is_active: updated.is_active,
      });

      setRoles((prev) =>
        prev.map((r) => (r.role_id === saved.role_id ? saved : r))
      );

      setRoleToEdit(null);
    } catch (err: any) {
      alert(err?.message ?? "Failed to update role");
    } finally {
      setLoading(false);
    }
  }

  // Soft delete
  async function confirmAndDelete() {
    if (!roleToDelete) return;
    try {
      setLoading(true);
      await apiDeleteRole(roleToDelete.role_id);

      setRoles((prev) => prev.filter((r) => r.role_id !== roleToDelete.role_id));
      setRoleToDelete(null);
    } catch (err: any) {
      alert(err?.message ?? "Failed to delete role");
    } finally {
      setLoading(false);
    }
  }

  function openDescModal(title: string, text: string) {
    setActiveDescTitle(title);
    setActiveDescText(text);
    setShowDescModal(true);
  }

  return (
    <div className={styles.rolesContainer}>
      
      

      
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Roles</h1>
          <p className={styles.subtitle}>Manage system roles & permissions</p>
        </div>

        <button className={styles.addBtn} onClick={() => setShowCreateModal(true)}>
          + Create Role
        </button>
      </header>

      <div className={styles.controlsRow}>
        <input
          type="search"
          className={styles.search}
          placeholder="Search roles by name, description, user or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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
        {showTopBtn && (
      <button className={`${styles.backToTop} show`} onClick={scrollToTop}>
        ↑
      </button>
    )}
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

                  <td>
                    {r.role_desc ? (
                      <div>
                        <div
                          className={styles.descCell}
                          title={r.role_desc}
                          onClick={() => openDescModal(`${r.role_name}`, r.role_desc)}
                        >
                          {r.role_desc.length > 120
                            ? r.role_desc.substring(0, 120) + "..."
                            : r.role_desc}
                        </div>

                        <button
                          className={styles.descView}
                          onClick={() => openDescModal(`${r.role_name}`, r.role_desc)}
                        >
                          View
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

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

      {/* Pagination */}
      <div className={styles.footerRow}>
        <div className={styles.countText}>
          {total === 0
            ? "No roles."
            : `Showing ${startIndex + 1}–${endIndex} of ${total} roles`}
        </div>

        <div className={styles.pagination}>
          <button
            className={styles.pagerBtn}
            disabled={page <= 1}
            onClick={() => goTo(page - 1)}
          >
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
              This will mark <strong>{roleToDelete.role_name}</strong> as inactive.
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
        <EditModal role={roleToEdit} onCancel={() => setRoleToEdit(null)} onSave={saveEdit} />
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <CreateModal
          onCancel={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}

      {/* DESCRIPTION MODAL (Option A placement) */}
      {showDescModal && (
        <DescriptionModal
          title={activeDescTitle}
          text={activeDescText}
          onClose={() => {
            setShowDescModal(false);
            setActiveDescText(null);
            setActiveDescTitle(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Description Modal ---------------- */
function DescriptionModal({
  title,
  text,
  onClose,
}: {
  title: string | null;
  text: string | null;
  onClose: () => void;
}) {
  if (!text) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.descriptionModalContent}`}>
        <h3 className={styles.descriptionModalTitle}>{title}</h3>

        <div style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{text}</div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Edit Modal ---------------- */

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

        <label className={styles.modalLabel}>Role Name</label>
        <input
          className={styles.modalInput}
          value={form.role_name}
          onChange={(e) => update("role_name", e.target.value)}
        />

        <label className={styles.modalLabel}>Active</label>
        <select
          className={styles.modalInput}
          value={form.is_active ? "1" : "0"}
          onChange={(e) => update("is_active", Number(e.target.value))}
        >
          <option value={1}>Active</option>
          <option value={0}>Inactive</option>
        </select>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={() => onSave(form)}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Create Modal ---------------- */

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
      await onSave({
        role_name: roleName.trim(),
        role_desc: roleDesc.trim(),
      });

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
