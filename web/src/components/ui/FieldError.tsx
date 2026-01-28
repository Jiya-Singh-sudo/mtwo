import { XCircle } from "lucide-react";

type Props = {
  message?: string;
};

export function FieldError({ message }: Props) {
  if (!message) return null;

  return (
    <div className="fieldError">
      <XCircle size={14} />
      <span>{message}</span>
    </div>
  );
}
