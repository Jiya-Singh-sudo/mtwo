import { Vehicle } from "../../../types/vehicles";
import { Eye, Pencil, Trash2 } from "lucide-react";

export default function VehiclesSection({
  vehicles
}: {
  vehicles: Vehicle[];
  onRefresh: () => void;
}) {
  return (
    <div className="card">
      <h3 className="section-title">Vehicles</h3>

      <table className="w-full text-sm">
        <thead className="bg-primary text-white">
          <tr>
            <th>No</th>
            <th>Name</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {vehicles.map(v => (
            <tr key={v.vehicle_no} className="border-b">
              <td>{v.vehicle_no}</td>
              <td>{v.vehicle_name}</td>
              <td>
                <span className="badge badge-success">
                  Active
                </span>
              </td>
              <td className="text-right space-x-2">
                <Eye className="inline cursor-pointer" />
                <Pencil className="inline cursor-pointer" />
                <Trash2 className="inline cursor-pointer" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
