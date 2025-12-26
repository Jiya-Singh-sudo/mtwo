import { useState, useEffect } from 'react';
import { Driver } from '../types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface DriverEditDialogProps {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (driver: Driver) => void;
}

export function DriverEditDialog({ driver, open, onOpenChange, onSave }: DriverEditDialogProps) {
  const [formData, setFormData] = useState<Driver | null>(null);

  useEffect(() => {
    if (driver) {
      setFormData({ ...driver });
    }
  }, [driver]);

  if (!formData) return null;

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Driver Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license">License Number</Label>
            <Input
              id="license"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Shift</Label>
            <Select
              value={formData.shift}
              onValueChange={(value: 'Day Shift' | 'Night Shift') =>
                setFormData({ ...formData, shift: value })
              }
            >
              <SelectTrigger id="shift">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day Shift">Day Shift</SelectItem>
                <SelectItem value="Night Shift">Night Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="active-status">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.isActive ? 'Driver is active' : 'Driver is inactive'}
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
