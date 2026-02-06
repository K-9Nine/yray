"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

export default function OrgSwitcher() {
    return (
        <div style={{ marginTop: 12 }}>
            <OrganizationSwitcher afterSelectOrganizationUrl="/debug/rls" />
        </div>
    );
}
