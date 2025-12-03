import styles from "./RolesPage.module.css"

export default function RolesPage() {
  const roles = [
    { name: "Admin", description: "Full access to dashboard and settings" },
    { name: "Manager", description: "Can manage guests and view analytics" },
    { name: "Viewer", description: "Read-only access" },
  ]

  return (
    <div className="container">
      <div className="card">
        <h1 className={styles.title}>Roles</h1>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Role</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
