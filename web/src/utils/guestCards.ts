import {
    Users,
    CalendarClock,
    CheckCircle,
    // XCircle,
    LogOut,
    LucideIcon
} from "lucide-react";

export type StatCardVariant = "blue" | "green" | "orange" | "purple" | "indigo";

export type GuestStatusCard = {
    key: string;
    label: string;
    icon: LucideIcon;
    color: StatCardVariant;
};

export const GUEST_STATUSES = [
    "All",
    "Scheduled",
    "Entered",
    "Exited",
] as const;

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
