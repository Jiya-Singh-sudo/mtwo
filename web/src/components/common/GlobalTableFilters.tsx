
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
};

export default function GlobalTableFilters({
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    onReset,
    children
}: Props) {
    return (
        <div className="bg-white border rounded-sm p-4 flex items-end gap-3 flex-wrap">

            {/* SEARCH */}
            <div className="flex-1 min-w-[200px]">
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
            <div>
                <label className="text-xs text-gray-500 block mb-1">From</label>
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 px-3 border rounded-sm"
                />
            </div>

            {/* TO */}
            <div>
                <label className="text-xs text-gray-500 block mb-1">To</label>
                <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 px-3 border rounded-sm"
                />
            </div>

            {/* RESET */}
            <button
                onClick={onReset}
                className="secondaryBtn h-10 px-4 border rounded-sm bg-gray-100 hover:bg-gray-200 text-sm font-medium"
            >
                Reset
            </button>

            {/* EXISTING BUTTON — UNTOUCHED */}
            {children}

        </div>
    );
}
