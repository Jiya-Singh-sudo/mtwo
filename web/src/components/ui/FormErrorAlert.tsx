import { X, XCircle } from "lucide-react";

type Props = {
  errors: Record<string, string>;
  onClose?: () => void;
};

export function FormErrorAlert({ errors, onClose }: Props) {
  if (!errors || Object.keys(errors).length === 0) return null;

  return (
    <div className="alert alert-error">
      <div className="alert-icon">
        <XCircle size={18} />
      </div>

      <span className="alert-text">
        Please fix the highlighted fields below.
      </span>

      {onClose && (
        <button
          className="alert-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
