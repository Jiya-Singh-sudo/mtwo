import { Driver } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { User, Phone, CreditCard, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DriverViewDialogProps {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriverViewDialog({ driver, open, onOpenChange }: DriverViewDialogProps) {
  if (!driver) return null;

  const getStatusBadge = () => {
    if (!driver.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (driver.currentAssignment) {
      return <Badge className="bg-blue-500">On Duty</Badge>;
    }
    return <Badge className="bg-green-500">Available</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Driver Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="size-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{driver.name}</h3>
              <p className="text-sm text-muted-foreground">{driver.id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Mobile Number</p>
                <p className="font-medium">{driver.mobile}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CreditCard className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">License Number</p>
                <p className="font-medium">{driver.licenseNumber}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Shift</p>
                <p className="font-medium">{driver.shift}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
            </div>

            {driver.currentAssignment && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="size-5 text-blue-600" />
                  <h4 className="font-semibold">Current Assignment</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Guest Name</p>
                    <p className="font-medium">{driver.currentAssignment.guestName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">From Date-Time</p>
                    <p className="font-medium">
                      {format(new Date(driver.currentAssignment.fromDateTime), 'PPp')}
                    </p>
                  </div>
                  {driver.currentAssignment.toDateTime && (
                    <div>
                      <p className="text-sm text-muted-foreground">To Date-Time</p>
                      <p className="font-medium">
                        {format(new Date(driver.currentAssignment.toDateTime), 'PPp')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}