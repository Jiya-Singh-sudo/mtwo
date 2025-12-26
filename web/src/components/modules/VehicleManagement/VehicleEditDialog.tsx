import { useState, useEffect } from 'react';
import { Vehicle } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';

interface VehicleEditDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vehicle: Vehicle) => void;
}

export function VehicleEditDialog({ vehicle, open, onOpenChange, onSave }: VehicleEditDialogProps) {
  const [formData, setFormData] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (vehicle) {
      setFormData({ ...vehicle });
    }
  }, [vehicle]);

  if (!formData) return null;

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
            <Input
              id="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Input
              id="vehicleType"
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="active-status">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.isActive ? 'Vehicle is active' : 'Vehicle is inactive'}
              </p>
            </div>
            <Switch
              id="active-status"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
