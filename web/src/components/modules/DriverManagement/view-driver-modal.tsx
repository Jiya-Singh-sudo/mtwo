import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Driver } from "../../../types/drivers";
import { Button } from "@/components/ui/button";

export default function ViewDriverModal({
  open,
  driver,
  onClose
}: {
  open: boolean;
  driver: Driver | null;
  onClose: () => void;
}) {
  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#002D62]">
            Driver Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><b>Name:</b> {driver.driver_name}</div>
          <div><b>Contact:</b> {driver.driver_contact}</div>
          <div><b>License:</b> {driver.driver_license}</div>
          <div>
            <b>Status:</b>{" "}
            {driver.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
