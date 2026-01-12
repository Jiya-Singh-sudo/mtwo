import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TableQuery, SortOrder } from "@/types/table";

const parseNumber = (v: string | null, fallback: number) =>
    v ? Number(v) || fallback : fallback;

const parseString = (v: string | null, fallback: string) =>
    v ?? fallback;
export function useTableQuery(defaults?: Partial<TableQuery>) {
    const [searchParams, setSearchParams] = useSearchParams();

    const [query, setQuery] = useState<TableQuery>(() => ({
        page: parseNumber(searchParams.get("page"), defaults?.page ?? 1),
        limit: parseNumber(searchParams.get("limit"), defaults?.limit ?? 10),
        search: parseString(searchParams.get("search"), defaults?.search ?? ""),
        status: parseString(searchParams.get("status"), defaults?.status ?? "All"),
        sortBy: parseString(searchParams.get("sortBy"), defaults?.sortBy ?? "entry_date") || "entry_date",
sortOrder:(searchParams.get("sortOrder") as SortOrder) ??defaults?.sortOrder ?? "desc",

        // ✅ ADD THESE TWO
        entryDateFrom: parseString(
            searchParams.get("entryDateFrom"),
            defaults?.entryDateFrom ?? ""
        ),
        entryDateTo: parseString(
            searchParams.get("entryDateTo"),
            defaults?.entryDateTo ?? ""
        ),
    }));
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    /* ---------- URL sync ---------- */
    useEffect(() => {
        const params: Record<string, string> = {
            page: String(query.page),
            limit: String(query.limit),
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        };

        if (query.search) params.search = query.search;
        if (query.status && query.status !== "All") params.status = query.status;
        if (query.entryDateFrom) params.entryDateFrom = query.entryDateFrom;
        if (query.entryDateTo) params.entryDateTo = query.entryDateTo;


        setSearchParams(params, { replace: true });
    }, [query, setSearchParams]);

    /* ---------- Debounced search ---------- */
    const [searchInput, setSearchInput] = useState(query.search);

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

        setPage: (page: number) =>
            setQuery((q) => ({ ...q, page })),

        setLimit: (limit: number) =>
            setQuery((q) => ({ ...q, limit, page: 1 })),

        setStatus: (status?: string) =>
            setQuery((q) => ({ ...q, status: status ?? "All", page: 1 })),

        setSort: (sortBy: string, sortOrder: SortOrder) =>
            setQuery((q) => ({ ...q, sortBy, sortOrder, page: 1 })),

        // ✅ ADD THESE
        setEntryDateFrom: (date: string) =>
            setQuery((q) => ({ ...q, entryDateFrom: date, page: 1 })),

        setEntryDateTo: (date: string) =>
            setQuery((q) => ({ ...q, entryDateTo: date, page: 1 })),
        total,
        setTotal,
        loading,
        setLoading,

    };
}
