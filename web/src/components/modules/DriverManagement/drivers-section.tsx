import { Driver } from "../../../types/drivers";
import { Eye, Pencil, Trash2 } from "lucide-react";

export default function DriversSection({
  drivers,
  onView,
  onEdit,
  onDelete
}: {
  drivers: Driver[];
  onView: (d: Driver) => void;
  onEdit: (d: Driver) => void;
  onDelete: (d: Driver) => void;
}) {
  return (
    <div className="card">
      <h3 className="section-title">Drivers</h3>

      <table className="w-full text-sm">
        <thead className="bg-primary text-white">
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>License</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {drivers.map(d => (
            <tr key={d.driver_id} className="border-b">
              <td>{d.driver_name}</td>
              <td>{d.driver_contact}</td>
              <td>{d.driver_license}</td>
              <td>
                <span className="badge badge-neutral">
                  Inactive
                </span>
              </td>
              <td className="text-right space-x-2">
                <Eye
                  className="inline cursor-pointer"
                  onClick={() => onView(d)}
                />
                <Pencil
                  className="inline cursor-pointer"
                  onClick={() => onEdit(d)}
                />
                <Trash2
                  className="inline cursor-pointer"
                  onClick={() => onDelete(d)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
