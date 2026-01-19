import {
    Hotel,
    CheckCircle,
    XCircle,
    Users,
    UserCog,
    LucideIcon,
} from "lucide-react";
import { COLOR_STYLES } from "./guestCards";

export type RoomStats = {
    total: number;
    available: number;
    occupied: number;
    withGuest: number;
    withHousekeeping: number;
};

export type RoomStatusCard = {
    key: string;
    label: string;
    icon: LucideIcon;
    color: string;
    value: (stats: RoomStats) => number;
};

export const ROOM_STATUS_CARDS: RoomStatusCard[] = [
    {
        key: "ALL",
        label: "All Rooms",
        icon: Hotel,
        color: COLOR_STYLES.blue,
        value: (s) => s.total,
    },
    {
        key: "AVAILABLE",
        label: "Available",
        icon: CheckCircle,
        color: COLOR_STYLES.green,
        value: (s) => s.available,
    },
    {
        key: "OCCUPIED",
        label: "Occupied",
        icon: XCircle,
        color: COLOR_STYLES.red,
        value: (s) => s.occupied,
    },
    {
        key: "WITH_GUEST",
        label: "Guest Assigned",
        icon: Users,
        color: COLOR_STYLES.purple,
        value: (s) => s.withGuest,
    },
    {
        key: "WITH_HOUSEKEEPING",
        label: "Housekeeping",
        icon: UserCog,
        color: COLOR_STYLES.yellow,
        value: (s) => s.withHousekeeping,
    },
];
