import { Input } from "@/components/ui/input";
import { FilterField } from "@/components/ui/FilterField";

type Props = {
    searchInput: string;
    setSearchInput: (val: string) => void;

    query: {
        entryDateFrom?: string;
        entryDateTo?: string;
    };

    batchUpdate: (updater: (prev: any) => any) => void;

    defaultSortBy?: string;
    variant?: "toolbar" | "default";
};

export function GuestTableFilters({
    searchInput,
    setSearchInput,
    query,
    batchUpdate,
    defaultSortBy = "entry_date",
}: Props) {
    return (
        <div className="flex items-center gap-3 flex-wrap">

            {/* LEFT — search grows to fill */}
            <FilterField label="Search" className="flex-1">
                <Input
                    placeholder="Search guest / room..."
                    value={searchInput}
                    onChange={(e: any) => setSearchInput(e.target.value)}
                    className="h-10 w-full"
                />
            </FilterField>

            {/* RIGHT — fixed controls, won't shrink */}
            <div className="flex items-center gap-3 shrink-0">

                {/* 📅 FROM */}
                <FilterField label="From" className="w-[150px]">
                    <input
                        type="date"
                        className="nicInput h-10"
                        value={query.entryDateFrom || ""}
                        onChange={(e) => {
                            const from = e.target.value;
                            batchUpdate((prev: any) => ({
                                ...prev,
                                page: 1,
                                entryDateFrom: from,
                                sortBy: defaultSortBy,
                                sortOrder: "asc",
                            }));
                        }}
                    />
                </FilterField>

                {/* 📅 TO */}
                <FilterField label="To" className="w-[150px]">
                    <input
                        type="date"
                        className="nicInput h-10"
                        value={query.entryDateTo || ""}
                        min={query.entryDateFrom || ""}
                        onChange={(e) =>
                            batchUpdate(prev => ({
                                ...prev,
                                page: 1,
                                entryDateTo: e.target.value,
                                sortBy: defaultSortBy,
                                sortOrder: "asc",
                            }))
                        }
                    />
                </FilterField>

                {/* 🔄 RESET */}
                <FilterField className="shrink-0">
                    <button
                        className="h-10 px-4 flex items-center secondaryBtn"
                        onClick={() => {
                            batchUpdate(prev => ({
                                ...prev,
                                page: 1,
                                entryDateFrom: "",
                                entryDateTo: "",
                                sortBy: defaultSortBy,
                                sortOrder: "desc",
                            }));
                        }}
                    >
                        Reset
                    </button>
                </FilterField>
            </div>
        </div>
    );
}
