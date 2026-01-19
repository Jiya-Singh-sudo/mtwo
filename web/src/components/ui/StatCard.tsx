import { LucideIcon } from "lucide-react";
import "./StatCard.css";

type StatCardVariant = "blue" | "green" | "orange" | "purple" | "indigo";

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
        <button
            type="button"
            onClick={onClick}
            className={`statCard ${variant} ${active ? "activeStat" : ""}`}
        >
            <Icon />
            <div>
                <p>{title}</p>
                <h3>{value}</h3>
            </div>
        </button>
    );
}
