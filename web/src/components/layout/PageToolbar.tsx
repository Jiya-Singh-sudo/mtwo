import React from "react";

type PageToolbarProps = {
    left?: React.ReactNode;
    right?: React.ReactNode;
};

export function PageToolbar({ left, right }: PageToolbarProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3 flex-1">
                {left}
            </div>

            {right && (
                <div className="flex items-end gap-3">
                    {right}
                </div>
            )}
        </div>
    );
}
