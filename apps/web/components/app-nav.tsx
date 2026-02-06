"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
    { href: "/assets", label: "Assets" },
    { href: "/scans", label: "Scans" },
    { href: "/findings", label: "Findings" },
];

export default function AppNav() {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-1">
            {links.map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                    <Link
                        key={l.href}
                        href={l.href}
                        className={cn(
                            "rounded-md px-3 py-1.5 text-sm",
                            active ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {l.label}
                    </Link>
                );
            })}
        </nav>
    );
}
