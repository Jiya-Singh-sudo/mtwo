export type Column<T> = {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;

  sortable?: boolean;
  sortKey?: string;
  emptyFallback?: React.ReactNode;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;

  page: number;
  limit: number;
  totalCount: number;

  sortBy: string;
  sortOrder: 'asc' | 'desc';
  loading: boolean;

  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  page,
  limit,
  totalCount,
  sortBy,
  sortOrder,
  loading,
  onPageChange,
  onLimitChange,
  onSortChange,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-4">
      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-[#F5A623] to-[#E09612]">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-3 text-left ${col.sortable ? "cursor-pointer select-none" : ""
                  }`}
                  onClick={() => {
                    if (loading || !col.sortable || !col.sortKey) return;

                    const nextOrder =
                      sortBy === col.sortKey && sortOrder === "asc" ? "desc" : "asc";

                    onSortChange(col.sortKey, nextOrder);
                  }}
                >
                  <div className="flex items-center gap-1">
                    {col.header}

                    {col.sortable && col.sortKey === sortBy && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: limit }).map((_, i) => (
                <tr key={i} className="border-b">
                  {columns.map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={String(row[keyField])}
                  className={`border-b ${loading ? "" : "hover:bg-gray-50"}`}>
                {columns.map((col, idx) => (
                    <td key={idx} className="px-6 py-4">
                        {col.render
                          ? col.render(row)
                          : row[col.accessor as keyof T] != null &&
                            row[col.accessor as keyof T] !== ""
                              ? String(row[col.accessor as keyof T])
                              : col.emptyFallback ?? "—"}
                    </td>
                  ))}
                  </tr>
                  
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        {/* Page info */}
        <div className="text-sm text-gray-600">
          Page <strong>{page}</strong> of <strong>{totalPages}</strong> •{" "}
          <strong>{totalCount}</strong> records
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Page size */}
          <select
            className="border rounded px-2 py-1 text-sm"
            value={limit}
            disabled={loading}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>

          {/* Previous */}
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>

          {/* Next */}
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            disabled={loading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}