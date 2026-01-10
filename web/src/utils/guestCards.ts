import {
    Users,
    CalendarClock,
    CheckCircle,
    // XCircle,
    LogOut,
    LucideIcon
} from "lucide-react";

export type GuestStatusCard = {
    key: string;
    label: string;
    icon: LucideIcon;
    color: string;
};
export const GUEST_STATUSES = [
    "All",
  "Scheduled",
  "Entered",
  "Exited",
] as const;

export const COLOR_STYLES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  orange: "bg-orange-100 text-orange-600",
  indigo: "bg-indigo-100 text-indigo-600",
};

export const GUEST_STATUS_CARDS: GuestStatusCard[] = [
    {
  key: "All",
  label: "All Guests",
  icon: Users,
  color: "blue",
},
    {
        key: "Scheduled",
        label: "Scheduled",
        icon: CalendarClock,
        color: "indigo",
    },
    {
        key: "Entered",
        label: "Entered",
        icon: CheckCircle,
        color: "green",
    },
    // {
    //     key: "Cancelled",
    //     label: "Cancelled",
    //     icon: XCircle,
    //     color: "red",
    // },
    {
        key: "Exited",
        label: "Exited",
        icon: LogOut,
        color: "orange",
    },
];
