import React from "react";

type FilterFieldProps = {
    label?: string;
    className?: string;
    children: React.ReactNode;
};

/**
 * Universal toolbar wrapper that gives every control the same vertical skeleton:
 *   [ label rail  ]   ← fixed height, invisible if no label
 *   [ control     ]   ← h-10 (set by child)
 *
 * This guarantees all controls in a `flex items-end` row share the same baseline.
 */
export function FilterField({ label, className = "", children }: FilterFieldProps) {
    return (
        <div className={`flex flex-col justify-end ${className}`}>
            <label className="text-xs mb-1 h-[16px]">
                {label || <span className="opacity-0">.</span>}
            </label>
            {children}
        </div>
    );
}
