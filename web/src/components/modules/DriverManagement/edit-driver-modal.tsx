import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Driver } from "../../../types/drivers";
import { useState } from "react";
import { updateDriver } from "../../../api/driver.api";
import { notifySuccess } from "../../common/toast";

export default function EditDriverModal({
    open,
    driver,
    onClose,
    onSaved
}: {
    open: boolean;
    driver: Driver | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState(driver);

    if (!driver || !form) return null;

    async function save() {
        await updateDriver(driver!.driver_id, form!);
        notifySuccess("Driver updated");
        onSaved();
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Driver</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <input
                        className="input"
                        value={form.driver_name}
                        onChange={e =>
                            setForm({ ...form, driver_name: e.target.value })
                        }
                    />
                    <input
                        className="input"
                        value={form.driver_contact}
                        onChange={e =>
                            setForm({ ...form, driver_contact: e.target.value })
                        }
                    />
                    <input
                        className="input"
                        value={form.driver_license}
                        onChange={e =>
                            setForm({ ...form, driver_license: e.target.value })
                        }
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={save}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

