import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Vehicle } from "../../../types/vehicles";
import { Driver } from "../../../types/drivers";
import { notifySuccess } from "../../common/toast";

interface Props {
    open: boolean;
    driver: Driver | null;
    vehicles: Vehicle[];
    onClose: () => void;
    onAssigned: () => void;
}

export default function AssignVehicleDialog({
    open,
    driver,
    vehicles,
    onClose,
    onAssigned
}: Props) {
    const [vehicleNo, setVehicleNo] = useState("");

    if (!driver) return null;

    async function handleAssign() {
        // 👉 yahan backend API call aayega later
        notifySuccess(
            `Vehicle ${vehicleNo} assigned to ${driver?.driver_name}`
        );
        setVehicleNo("");
        onAssigned();
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-[#002D62]">
                        Assign Vehicle
                        <span className="text-sm text-gray-500 ml-2">
                            वाहन आवंटित करें
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">
                            Driver
                        </label>
                        <div className="mt-1 text-gray-700">
                            {driver.driver_name}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">
                            Select Vehicle
                        </label>
                        <select
                            className="w-full mt-1 border rounded px-3 py-2"
                            value={vehicleNo}
                            onChange={e => setVehicleNo(e.target.value)}
                        >
                            <option value="">Select vehicle</option>
                            {vehicles.map(v => (
                                <option key={v.vehicle_no} value={v.vehicle_no}>
                                    {v.vehicle_no} – {v.vehicle_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            disabled={!vehicleNo}
                            onClick={handleAssign}
                        >
                            Assign
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
