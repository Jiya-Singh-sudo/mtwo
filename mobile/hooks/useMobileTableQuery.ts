import { useState, useEffect } from 'react';

export type MobileTableQuery = {
  page: number;
  limit: number;
  search: string;
  status?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  entryDateFrom?: string;
  entryDateTo?: string;
};

export function useMobileTableQuery(
  initial?: Partial<MobileTableQuery>
) {
  const [query, setQuery] = useState<MobileTableQuery>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'asc',
    status: undefined,
    entryDateFrom: '',
    entryDateTo: '',
    ...initial,
  });

  const [searchInput, setSearchInput] = useState(query.search);

  /* 🔥 Debounced search (same as web) */
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

  return {
    query,

    searchInput,
    setSearchInput,

    setPage: (page: number) =>
      setQuery((q) => ({ ...q, page })),

    setLimit: (limit: number) =>
      setQuery((q) => ({ ...q, limit, page: 1 })),

    setStatus: (status?: string) =>
      setQuery((q) => ({ ...q, status, page: 1 })),

    setSort: (sortBy: string, sortOrder: 'asc' | 'desc' = 'asc') =>
      setQuery((q) => ({ ...q, sortBy, sortOrder, page: 1 })),

    setEntryDateFrom: (date: string) =>
      setQuery((q) => ({ ...q, entryDateFrom: date, page: 1 })),

    setEntryDateTo: (date: string) =>
      setQuery((q) => ({ ...q, entryDateTo: date, page: 1 })),

    batchUpdate: (updater: (prev: MobileTableQuery) => MobileTableQuery) =>
      setQuery(updater),

    reset: () =>
      setQuery({
        page: 1,
        limit: 10,
        search: '',
        sortBy: 'created_at',
        sortOrder: 'asc',
        status: undefined,
        entryDateFrom: '',
        entryDateTo: '',
      }),
  };
}