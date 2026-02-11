import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TableQuery, SortOrder } from "@/types/table";

type UseTableQueryReturn = {
    query: TableQuery;
    searchInput: string;
    setSearchInput: (v: string) => void;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setStatus: (status?: string) => void;
    setSort: (sortBy: string, sortOrder: SortOrder) => void;
    setEntryDateFrom: (date: string) => void;
    setEntryDateTo: (date: string) => void;
    setNetworkType?: (type?: TableQuery["networkType"]) => void;

    batchUpdate: (updater: (prev: TableQuery) => TableQuery) => void;

    total: number;
    setTotal: (n: number) => void;
    loading: boolean;
    setLoading: (v: boolean) => void;
};


const parseNumber = (v: string | null, fallback: number) =>
    v ? Number(v) || fallback : fallback;

const parseString = <T extends string | undefined>(
    v: string | null,
    fallback?: T
): string | T | undefined => v ?? fallback;

export function useTableQuery(
    defaults?: (Partial<TableQuery> & { prefix?: string })
): UseTableQueryReturn {

    const [searchParams, setSearchParams] = useSearchParams();
    const prefix = defaults?.prefix ? `${defaults.prefix}_` : "";
    const key = (k: string) => `${prefix}${k}`;

    const resolvedSortBy =
        parseString(searchParams.get(key("sortBy")), undefined) ??
        defaults?.sortBy ??
        "entry_date";

    const resolvedSortOrder =
        (searchParams.get(key("sortOrder")) as SortOrder) ??
        defaults?.sortOrder ??
        "desc";

    const [query, setQuery] = useState<TableQuery>(() => ({
        page: parseNumber(searchParams.get(key("page")), defaults?.page ?? 1),
        limit: parseNumber(searchParams.get(key("limit")), defaults?.limit ?? 10),
        search: parseString(searchParams.get(key("search")), defaults?.search ?? ""),
        status: parseString(searchParams.get(key("status")), defaults?.status),
        sortBy: resolvedSortBy,
        sortOrder: resolvedSortOrder,
        entryDateFrom: parseString(
            searchParams.get(key("entryDateFrom")),
            defaults?.entryDateFrom ?? ""
        ),
        entryDateTo: parseString(
            searchParams.get(key("entryDateTo")),
            defaults?.entryDateTo ?? ""

        ),
        networkType: parseString(
            searchParams.get(key("networkType")),
            defaults?.networkType
        ) as TableQuery["networkType"],

        mealType: parseString(
            searchParams.get(key("mealType")),
            defaults?.mealType
        ) as TableQuery["mealType"],

        foodStatus: parseString(
            searchParams.get(key("foodStatus")),
            defaults?.foodStatus
        ) as TableQuery["foodStatus"],

    }));
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    /* ---------- URL sync ---------- */
    useEffect(() => {
        const params: Record<string, string> = {
            [key("page")]: String(query.page),
            [key("limit")]: String(query.limit),
            [key("sortBy")]: query.sortBy,
            [key("sortOrder")]: query.sortOrder,
        };

        if (query.search) params[key("search")] = query.search;
        if (query.status)
            params[key("status")] = query.status;
        if (query.networkType)
            params[key("networkType")] = query.networkType;
        // if (query.entryDateFrom)
        //     params[key("entryDateFrom")] = query.entryDateFrom;
        // if (query.entryDateTo)
        //     params[key("entryDateTo")] = query.entryDateTo;
        
        if (query.mealType)
            params[key("mealType")] = query.mealType;

        if (query.foodStatus)
            params[key("foodStatus")] = query.foodStatus;

        if (query.entryDateFrom)
            params[key("entryDateFrom")] = query.entryDateFrom;

        if (query.entryDateTo)
            params[key("entryDateTo")] = query.entryDateTo;

        setSearchParams(params, { replace: true });
    }, [query, setSearchParams]);

    /* ---------- Debounced search ---------- */
    const [searchInput, setSearchInput] = useState(query.search ?? "");

    useEffect(() => {
        const t = setTimeout(() => {
            setQuery((q) => ({
                ...q,
                search: searchInput,
                page: 1,
            }));
        }, 400);

        return () => clearTimeout(t);
    }, [searchInput]);

    /* ---------- Helpers ---------- */
    return {
        query,

        searchInput,
        setSearchInput,
        setNetworkType: (networkType?: "WiFi" | "Broadband" | "Hotspot" | "Leased-Line") =>
            setQuery((q) => ({ ...q, networkType, page: 1 })),

        setPage: (page: number) =>
            setQuery((q) => ({ ...q, page })),

        setLimit: (limit: number) =>
            setQuery((q) => ({ ...q, limit, page: 1 })),

        setStatus: (status?: string) =>
            setQuery((q) => ({ ...q, status, page: 1 })),

        setSort: (sortBy: string, sortOrder: SortOrder) =>
            setQuery((q) => ({ ...q, sortBy, sortOrder, page: 1 })),

        setEntryDateFrom: (date: string) =>
            setQuery((q) => ({ ...q, entryDateFrom: date, page: 1 })),

        setEntryDateTo: (date: string) =>
            setQuery((q) => ({ ...q, entryDateTo: date, page: 1 })),

        batchUpdate: (updater) =>
            setQuery((prev) => updater(prev)),

        total,
        setTotal,
        loading,
        setLoading,
    };
}
