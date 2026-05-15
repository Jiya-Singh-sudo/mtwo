
import React from "react";

type Props = {
    search: string;
    setSearch: (v: string) => void;

    fromDate: string;
    setFromDate: (v: string) => void;

    toDate: string;
    setToDate: (v: string) => void;

    onReset: () => void;

    children?: React.ReactNode;
    variant?: "toolbar" | "default";
    className?: string;
};

export default function GlobalTableFilters({
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    onReset,
    children,
    variant = "default",
    className = ""
}: Props) {
    const wrapperClassName = `
      infoFilters
      flex
      items-end
      gap-4
      w-full
      flex-nowrap
      bg-white
      border
      rounded-sm
      p-4
      ${variant === "toolbar" ? "bg-slate-50" : ""}
      ${className}
    `;

    return (
        <div className={wrapperClassName}>

            {/* SEARCH */}
            <div className="flex-1 min-w-[260px] max-w-md">
                <label className="text-xs text-gray-500 block mb-2">Search</label>
                <input
                    type="text"
                    placeholder="Search by name, department or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 px-3 border rounded-sm"
                />
            </div>

            {/* FROM */}
            <div className="shrink-0">
                <label className="text-xs text-gray-500 block mb-2">From</label>
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 px-3 border rounded-sm"
                />
            </div>

            {/* TO */}
            <div className="shrink-0">
                <label className="text-xs text-gray-500 block mb-2">To</label>
                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 px-3 border rounded-sm"
                />
            </div>

            {/* RESET */}
            <div className="shrink-0 self-end">
                <button
                    onClick={onReset}
                    className="secondaryBtn h-11 px-5 border rounded-md bg-white hover:bg-gray-100 text-sm font-medium"
                >
                    Reset
                </button>
            </div>

            <div className="shrink-0 self-end">
                {children}
            </div>

        </div>
    );
}
