export interface DashboardOverview {
  guests: {
    total: number;
    checkedIn: number;
    upcomingArrivals: number;
    checkedOutToday: number;
  };
  occupancy: {
    roomPercent: number;
    vehiclePercent: number;
    dutyRosterPercent: number;
    notificationPercent: number;
  };
  recentActivity: {
    message: string;
    timestamp: string;
  }[];
}
