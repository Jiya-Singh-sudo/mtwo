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
  networkType?: "WiFi" | "Broadband" | "Hotspot" | "Leased-Line";
  mealType?: "Breakfast" | "Lunch" | "High Tea" | "Dinner";
  foodStatus?: "SERVED" | "NOT_SERVED";


}; 