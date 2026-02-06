"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function TenantDebug() {
    const [tenantKey, setTenantKey] = useState<string | null>(null);

    useEffect(() => {
        // Optional: call a server route that returns tenant_key via xray_whoami()
        // If you don’t want this yet, delete this effect + tenantKey UI.
        fetch("/api/whoami")
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => setTenantKey(j?.tenant_key ?? null))
            .catch(() => setTenantKey(null));
    }, []);

    return (
        <div className="flex items-center gap-3">
            <OrganizationSwitcher
                appearance={{
                    elements: {
                        rootBox: "hidden sm:block",
                    },
                }}
            />
            <UserButton />

            {tenantKey && (
                <div className="hidden rounded-md border px-2 py-1 text-xs text-muted-foreground sm:block">
                    tenant: <span className="font-medium text-foreground">{tenantKey}</span>
                </div>
            )}
        </div>
    );
}
