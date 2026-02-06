"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function listScanJobs() {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
        .from("scan_jobs")
        .select("id, scan_id, status, scan_profile, claimed_by, claimed_at, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function queueBaselineScan(_formData: FormData) {
    const supabase = await supabaseServer();

    const { data: who, error: whoErr } = await supabase.rpc("xray_whoami");
    if (whoErr) throw new Error(whoErr.message);

    const tenant_key = who?.tenant_key as string | null;
    if (!tenant_key) throw new Error("No tenant_key (select an org in Clerk).");

    const { data: scan, error: scanErr } = await supabase
        .from("scans")
        .insert({
            tenant_key,
            scan_kind: "on_demand",
            scan_profile: "baseline",
            status: "queued",
        })
        .select("id, status, created_at")
        .single();

    if (scanErr) throw new Error(`scans insert failed: ${scanErr.message}`);

    const { data: job, error: jobErr } = await supabase
        .from("scan_jobs")
        .insert({
            tenant_key,
            scan_id: scan.id,
            status: "queued",
            scan_profile: "baseline",
        })
        .select("id, scan_id, status, created_at")
        .single();

    if (jobErr) throw new Error(`scan_jobs insert failed: ${jobErr.message}`);

    revalidatePath("/scans");
    // Return void to satisfy form action type in page.tsx
}
