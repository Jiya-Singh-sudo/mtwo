import styles from "./HomePage.module.css"

export default function HomePage() {
  return (
    <div className="container">
      <div className="card">
        <h1 className={styles.title}>Dashboard Home</h1>
        <p className={styles.subtitle}>Welcome to the MTWO Web Panel</p>
      </div>
    </div>
  )
}
