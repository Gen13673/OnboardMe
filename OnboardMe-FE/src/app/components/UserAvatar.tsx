"use client";

import React from "react";

const colorClasses = [
    "from-blue-500 to-indigo-600",
    "from-pink-500 to-rose-600",
    "from-green-500 to-emerald-600",
    "from-purple-500 to-violet-600",
    "from-orange-500 to-amber-600",
    "from-cyan-500 to-teal-600",
    "from-yellow-500 to-orange-600",
];

function getColorIndex(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash + name.charCodeAt(i)) % 2147483647;
    }
    return hash % colorClasses.length;
}

function getColorClass(firstName?: string, lastName?: string) {
    const key = `${firstName ?? ""}${lastName ?? ""}`.trim().toUpperCase();
    return colorClasses[getColorIndex(key)];
}

function getInitials(firstName?: string, lastName?: string) {
    return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}

type Props = {
    firstName?: string;
    lastName?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string; // para clases extra
};

const sizeMap: Record<NonNullable<Props["size"]>, string> = {
    xs: "h-6 w-6 text-xs",
    sm: "h-9 w-9 text-sm",
    md: "h-12 w-12 text-base",
    lg: "h-16 w-16 text-lg",
    xl: "h-20 w-20 text-xl",
};

export function UserAvatar({
    firstName,
    lastName,
    size = "md",
    className = "",
}: Props) {
    const initials = getInitials(firstName, lastName);
    const colorClass = getColorClass(firstName, lastName);

    return (
        <div
            className={`rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-semibold shadow-sm ${sizeMap[size]} ${className}`}
        >
            {initials || "?"}
        </div>
    );
}
