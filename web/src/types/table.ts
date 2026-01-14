export type SortOrder = "asc" | "desc";
export type TableQuery = {
  page: number;
  limit: number;

  search?: string;
  status?: string;

  sortBy: string;
  sortOrder: 'asc' | 'desc';

  entryDateFrom?: string;
  entryDateTo?: string;
}; 