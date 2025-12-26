import { toast } from "react-hot-toast";

export function notifySuccess(message: string) {
  toast.success(message, { position: "bottom-right" });
}

export function notifyError(message: string) {
  toast.error(message, { position: "bottom-right" });
}
