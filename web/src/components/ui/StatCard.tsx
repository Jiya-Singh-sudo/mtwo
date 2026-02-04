import { LucideIcon } from "lucide-react";
import "./StatCard.css";

type StatCardVariant = "blue" | "green" | "orange" | "purple" | "indigo" | "red" | "yellow" | "gray";

type StatCardProps = {
    title: string;
    value: number;
    icon: LucideIcon;
    variant: StatCardVariant;
    active?: boolean;
    onClick?: () => void;
};

export function StatCard({
    title,
    value,
    icon: Icon,
    variant,
    active,
    onClick,
}: StatCardProps) {
    return (
        <div
            onClick={onClick}
            className={`statCard ${variant} ${active ? "activeStat" : ""}`}
        >
            {/* ICON BOX */}
            <div className={`statIcon ${variant}`}>
                <Icon />
            </div>

            {/* CONTENT */}
            <div className="statContent">
                <p className="statLabel">{title}</p>
                <h3 className="statValue">{value}</h3>
            </div>
        </div>
    );
}
