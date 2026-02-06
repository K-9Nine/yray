import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/app-nav";
import TenantDebug from "@/components/tenant-debug";

export default async function AppLayout({ children }: { children: ReactNode }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="font-semibold">XRAY</Link>
                        <AppNav />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Clerk org switcher lives here */}
                        <TenantDebug />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}

import Link from "next/link";
