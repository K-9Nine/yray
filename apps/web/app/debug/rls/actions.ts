"use server";

import { supabaseServer } from "@/lib/supabase/server";

import { revalidatePath } from "next/cache";

export async function seedAsset() {
    const supabase = await supabaseServer();

    const payload = {
        asset_type: "domain",
        asset_value: "example.com",
        tags: ["seed"],
    };

    const { error } = await supabase
        .from("assets")
        .upsert(payload, { onConflict: "tenant_key,asset_type,asset_value" })
        .select("id, tenant_key, asset_type, asset_value, tags, created_at")
        .single();

    if (error) throw new Error(error.message);
    revalidatePath("/debug/rls");
}

export async function createScanJobBaseline() {
    const supabase = await supabaseServer();

    // 1) Create scan row
    const { data: scan, error: scanErr } = await supabase
        .from("scans")
        .insert({
            scan_kind: "on_demand",
            scan_profile: "baseline",
            status: "queued",
        })
        .select("id, tenant_key, status, scan_profile")
        .single();

    if (scanErr) throw new Error(`scans insert failed: ${scanErr.message}`);

    // 2) Create scan_job row
    const { error: jobErr } = await supabase
        .from("scan_jobs")
        .insert({
            tenant_key: scan.tenant_key,
            scan_id: scan.id,
            status: "queued",
            scan_profile: "baseline",
            // optional: restrict this job to specific assets
            // requested_asset_ids: [ ... ],
        })
        .select("id, tenant_key, scan_id, status, scan_profile, created_at")
        .single();

    if (jobErr) throw new Error(`scan_jobs insert failed: ${jobErr.message}`);

    revalidatePath("/debug/rls");
}
