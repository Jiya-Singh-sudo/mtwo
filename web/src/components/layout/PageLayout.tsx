import React from "react";

type PageLayoutProps = {
    title: string;
    subtitle?: string;
    toolbar?: React.ReactNode;
    stats?: React.ReactNode;
    children: React.ReactNode;
};

export function PageLayout({
    title,
    subtitle,
    toolbar,
    stats,
    children,
}: PageLayoutProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-[#00247D] text-xl font-semibold">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-sm text-gray-600">{subtitle}</p>
                )}
            </div>

            {/* Toolbar */}
            {toolbar && (
                <div className="bg-white border rounded-sm p-4">
                    {toolbar}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="statsGrid">
                    {stats}
                </div>
            )}

            {/* Content */}
            <div className="bg-white border rounded-sm overflow-hidden">
                {children}
            </div>
        </div>
    );
}
