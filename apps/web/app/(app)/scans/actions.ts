"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function listRecentScanJobs(limit = 25) {
    const supabase = await supabaseServer();

    // Read-only, tenant-scoped by RLS
    const { data, error } = await supabase
        .from("scan_jobs")
        .select("id, scan_id, status, scan_profile, claimed_by, attempts, last_error, created_at, updated_at, claimed_at, started_at, finished_at")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function queueBaselineScanForAllAssets() {
    const supabase = await supabaseServer();

    // Get tenant + user id from your helper function (keeps tenant_key correct)
    const { data: who, error: whoErr } = await supabase.rpc("xray_whoami");
    if (whoErr) throw new Error(whoErr.message);

    const tenant_key = (who as any)?.tenant_key as string | null;
    const user_id = (who as any)?.jwt?.sub as string | null;

    if (!tenant_key) throw new Error("No tenant_key (select an org in Clerk).");

    // 1) Insert scan (tenant_key is enforced by RLS WITH CHECK)
    const { data: scan, error: scanErr } = await supabase
        .from("scans")
        .insert({
            tenant_key,
            scan_kind: "on_demand",
            scan_profile: "baseline",
            status: "queued",
            triggered_by_user_id: user_id ?? null,
            requested_asset_ids: null, // NULL => "all assets"
        })
        .select("id, tenant_key, status, scan_profile, created_at")
        .maybeSingle();

    if (scanErr) throw new Error(`scans insert failed: ${scanErr.message}`);
    if (!scan) throw new Error("scans insert returned no row");

    // 2) Insert scan_job
    const { data: job, error: jobErr } = await supabase
        .from("scan_jobs")
        .insert({
            tenant_key,
            scan_id: scan.id,
            status: "queued",
            scan_profile: scan.scan_profile ?? "baseline",
            requested_asset_ids: null,
        })
        .select("id, scan_id, status, created_at")
        .maybeSingle();

    if (jobErr) throw new Error(`scan_jobs insert failed: ${jobErr.message}`);
    if (!job) throw new Error("scan_jobs insert returned no row");

    revalidatePath("/scans");
    // return { scan, job }; // Return void to satisfy form action signature
}
