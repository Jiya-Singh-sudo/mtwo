import {
    Users,
    CalendarClock,
    CheckCircle,
    // XCircle,
    LogOut,
    LucideIcon,
    XCircle,
    // LogIn
} from "lucide-react";

export type StatCardVariant = "blue" | "green" | "orange" | "purple" | "indigo" | "red" | "yellow" | "gray";

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
  "Inside",
  "Exited",
  "Cancelled",
] as const;

export const GUEST_STATUS_CARDS: GuestStatusCard[] = [
  { key: "All", label: "All Guests", color: "blue", icon: Users },
  { key: "Scheduled", label: "Scheduled", color: "yellow", icon: CalendarClock },
  { key: "Entered", label: "Entered", color: "green", icon: CheckCircle },
//   { key: "Inside", label: "Inside", color: "indigo", icon: LogIn },
  { key: "Exited", label: "Exited", color: "red", icon: LogOut },
  { key: "Cancelled", label: "Cancelled", color: "gray", icon: XCircle },
];

// export const GUEST_STATUS_CARDS: GuestStatusCard[] = [
//     {
//         key: "All",
//         label: "All Guests",
//         icon: Users,
//         color: "blue",
//     },
//     {
//         key: "Scheduled",
//         label: "Scheduled",
//         icon: CalendarClock,
//         color: "indigo",
//     },
//     {
//         key: "Entered",
//         label: "Entered",
//         icon: CheckCircle,
//         color: "green",
//     },
//     // {
//     //     key: "Cancelled",
//     //     label: "Cancelled",
//     //     icon: XCircle,
//     //     color: "red",
//     // },
//     {
//         key: "Exited",
//         label: "Exited",
//         icon: LogOut,
//         color: "orange",
//     },
// ];
