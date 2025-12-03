import { useEffect, useState } from "react";
import styles from "./RolePage.module.css";

interface Role {
  role_id: number;
  role_name: string;
  role_desc: string;
  is_active: number;
  inserted_at: string;
  inserted_by: string;
  inserted_ip: string;
  updated_at: string;
  updated_by: string;
  updated_ip: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const sample: Role[] = [
      {
        role_id: 1,
        role_name: "Admin",
        role_desc: "Full access",
        is_active: 1,
        inserted_at: "2024-12-01 10:00",
        inserted_by: "system",
        inserted_ip: "127.0.0.1",
        updated_at: "2024-12-05 11:20",
        updated_by: "system",
        updated_ip: "127.0.0.1",
      },
      {
        role_id: 2,
        role_name: "Manager",
        role_desc: "Manages operations",
        is_active: 1,
        inserted_at: "2024-12-01 12:40",
        inserted_by: "admin",
        inserted_ip: "127.0.0.2",
        updated_at: "2024-12-05 14:20",
        updated_by: "admin",
        updated_ip: "127.0.0.3",
      }
    ];
    setRoles(sample);
  }, []);

  const filtered = roles.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.role_name.toLowerCase().includes(q) ||
      r.role_desc.toLowerCase().includes(q) ||
      r.inserted_by.toLowerCase().includes(q) ||
      r.updated_by.toLowerCase().includes(q) ||
      r.inserted_ip.toLowerCase().includes(q) ||
      r.updated_ip.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.page}>
      
      {/* Orange Header Box */}
      <div className={styles.headerCard}>
        <div>
          <h1 className={styles.title}>Roles</h1>
          <p className={styles.subtitle}>Manage system roles & permissions</p>
        </div>
        <button className={styles.addButton}>+ Add Role</button>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        className={styles.search}
        placeholder="Search roles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table Container */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Role ID</th>
              <th>Name</th>
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
            {filtered.map((r) => (
              <tr key={r.role_id}>
                <td>{r.role_id}</td>
                <td>{r.role_name}</td>
                <td>{r.role_desc}</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      r.is_active ? styles.active : styles.inactive
                    }`}
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{r.inserted_at}</td>
                <td>{r.inserted_by}</td>
                <td>{r.inserted_ip}</td>
                <td>{r.updated_at}</td>
                <td>{r.updated_by}</td>
                <td>{r.updated_ip}</td>

                <td className={styles.actions}>
                  <button className={styles.editBtn}>Edit</button>
                  <button className={styles.deleteBtn}>Delete</button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
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
  );
}