// Vehicle.tsx updated attributes
import React, { useState, useEffect } from "react";
import styles from "./VehiclePage.module.css";

interface Vehicle {
  vehicle_no: string;
  vehicle_name: string;
  model: string;
  manufacturing: string;
  capacity: number;
  active: boolean;
  inserted_at: string;
  inserted_by: string;
  inserted_ip: string;
  updated_at?: string;
  updated_by?: string;
  updated_ip?: string;
}

const VehiclePage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("{}");

  useEffect(() => {
    setVehicles([
      {
        vehicle_no: "VH-001",
        vehicle_name: "Delivery Truck",
        model: "Ford F150",
        manufacturing: "Ford Motors",
        capacity: 2000,
        active: true,
        inserted_at: new Date().toISOString(),
        inserted_by: "admin",
        inserted_ip: "192.168.1.10",
      },
    ]);
  }, []);

  const filtered = vehicles.filter((v) =>
    v.vehicle_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vehicles</h1>
        <p className={styles.subtitle}>Vehicle Management</p>
      </div>

      <input
        className={styles.search}
        placeholder="Search vehicles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vehicle No</th>
                  <th>Name</th>
                  <th>Model</th>
                  <th>Manufacturing</th>
                  <th>Capacity</th>
                  <th>Active</th>
                  <th>Inserted At</th>
                  <th>Inserted By</th>
                  <th>Inserted IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.vehicle_no}>
                    <td className={styles.mono}>{v.vehicle_no}</td>
                    <td>{v.vehicle_name}</td>
                    <td>{v.model}</td>
                    <td>{v.manufacturing}</td>
                    <td>{v.capacity}</td>
                    <td>{v.active ? "Yes" : "No"}</td>
                    <td>{v.inserted_at}</td>
                    <td>{v.inserted_by}</td>
                    <td className={styles.mono}>{v.inserted_ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclePage;