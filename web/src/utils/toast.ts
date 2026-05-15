import { toast } from "sonner";

/* =========================
   SUCCESS
========================= */

export function showSuccess(message: string) {
  toast.success(message, {
    style: {
      border: "1px solid #16a34a",
    },
  });
}

/* =========================
   VALIDATION
========================= */

export function showValidation(message: string) {
  toast.warning(message, {
    style: {
      border: "1px solid #f59e0b",
    },
  });
}

/* =========================
   SERVER
========================= */

export function showServerError(
  message = "Server error occurred"
) {
  toast.error(message, {
    style: {
      border: "1px solid #dc2626",
    },
  });
}

/* =========================
   NORMAL ERROR
========================= */

export function showError(message: string) {
  toast.error(message, {
    style: {
      border: "1px solid #ef4444",
    },
  });
}
