interface Props {
  open: boolean;
  title: string;
  data: any[];
  onClose: () => void;
}

export function ReportPreviewModal({ open, title, data, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-4/5 max-h-[80vh] rounded-sm overflow-hidden">
        <div className="flex justify-between p-4 border-b">
          <h3 className="text-[#00247D]">{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-4 overflow-auto">
          <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
