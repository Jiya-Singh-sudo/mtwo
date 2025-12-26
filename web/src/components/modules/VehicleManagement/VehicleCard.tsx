import { Vehicle } from '../../../types/vehicles';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Pencil, Trash2, Car } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onView: (vehicle: Vehicle) => void;
  onAssign: (vehicle: Vehicle) => void;
}

export function VehicleCard({ vehicle, onEdit, onDelete, onView, onAssign }: VehicleCardProps) {
  const getStatusBadge = () => {
    if (!vehicle.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>;
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => onView(vehicle)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Car className="size-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">{vehicle.vehicle_no}</h3>
              <p className="text-sm text-muted-foreground">{vehicle.vehicle_name}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-2 mb-4">
          {vehicle.model && (
            <div className="text-sm text-muted-foreground">
              <span>Model: </span>
              <span className="font-medium text-foreground">{vehicle.model}</span>
            </div>
          )}
          {vehicle.capacity && (
            <div className="text-sm text-muted-foreground">
              <span>Capacity: </span>
              <span className="font-medium text-foreground">{vehicle.capacity} seats</span>
            </div>
          )}
          {vehicle.color && (
            <div className="text-sm text-muted-foreground">
              <span>Color: </span>
              <span className="font-medium text-foreground">{vehicle.color}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 opacity-0 md:group-hover:opacity-100 md:transition-opacity sm:opacity-100" onClick={(e) => e.stopPropagation()}>
          {vehicle.is_active && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onAssign(vehicle);
              }}
            >
              <span>Assign</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(vehicle);
            }}
          >
            <Pencil className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(vehicle);
            }}
          >
            <Trash2 className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}