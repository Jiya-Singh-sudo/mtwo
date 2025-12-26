import { Vehicle } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Car, User, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface VehicleViewDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleViewDialog({ vehicle, open, onOpenChange }: VehicleViewDialogProps) {
  if (!vehicle) return null;

  const getStatusBadge = () => {
    if (!vehicle.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (vehicle.currentAssignment) {
      return <Badge className="bg-blue-500">On Duty</Badge>;
    }
    return <Badge className="bg-green-500">Available</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vehicle Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-orange-100 flex items-center justify-center">
              <Car className="size-8 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{vehicle.vehicleNumber}</h3>
              <p className="text-sm text-muted-foreground">{vehicle.vehicleType}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Car className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Vehicle Number</p>
                <p className="font-medium">{vehicle.vehicleNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Car className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Vehicle Type</p>
                <p className="font-medium">{vehicle.vehicleType}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
            </div>

            {vehicle.currentAssignment ? (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="size-5 text-blue-600" />
                  <h4 className="font-semibold">Current Assignment</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Guest Name</p>
                    <p className="font-medium">{vehicle.currentAssignment.guestName}</p>
                  </div>
                  {vehicle.currentAssignment.driverName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Driver Name</p>
                      <p className="font-medium">{vehicle.currentAssignment.driverName}</p>
                    </div>
                  )}
                  {vehicle.currentAssignment.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      <p className="font-medium">{vehicle.currentAssignment.location}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">From Date-Time</p>
                    <p className="font-medium">
                      {format(new Date(vehicle.currentAssignment.fromDateTime), 'PPp')}
                    </p>
                  </div>
                  {vehicle.currentAssignment.toDateTime && (
                    <div>
                      <p className="text-sm text-muted-foreground">To Date-Time</p>
                      <p className="font-medium">
                        {format(new Date(vehicle.currentAssignment.toDateTime), 'PPp')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">No active assignment</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}