
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
    variant = "default"
}: Props) {
    const wrapperClassName = `flex items-center gap-3 w-full flex-nowrap bg-white border rounded-sm p-4 ${variant === "toolbar" ? "bg-slate-50" : ""}`;

    return (
        <div className={wrapperClassName}>

            {/* SEARCH */}
            <div className="flex-1 min-w-[260px] max-w-md">
                <label className="text-xs text-gray-500 block mb-1">Search</label>
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
                <label className="text-xs text-gray-500 block mb-1">From</label>
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 px-3 border rounded-sm"
                />
            </div>

            {/* TO */}
            <div className="shrink-0">
                <label className="text-xs text-gray-500 block mb-1">To</label>
                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 px-3 border rounded-sm"
                />
            </div>

            {/* RESET */}
            <div className="shrink-0 flex items-end h-[60px]">
                <button
                    onClick={onReset}
                    className="secondaryBtn h-10 px-4 border rounded-sm bg-gray-100 hover:bg-gray-200 text-sm font-medium"
                >
                    Reset
                </button>
            </div>

            {/* EXISTING BUTTON — UNTOUCHED */}
            <div className="shrink-0 flex items-end h-[60px]">
                {children}
            </div>

        </div>
    );
}
