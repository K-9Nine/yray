"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function listAssets() {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
        .from("assets")
        .select("id, tenant_key, asset_type, asset_value, tags, created_at")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function addAsset(formData: FormData) {
    const asset_type = String(formData.get("asset_type") ?? "");
    const asset_value = String(formData.get("asset_value") ?? "").trim();
    const tagsRaw = String(formData.get("tags") ?? "").trim();

    if (!asset_type || !asset_value) throw new Error("asset_type and asset_value required");

    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : null;

    const supabase = await supabaseServer();

    const { data: who, error: whoErr } = await supabase.rpc("xray_whoami");
    if (whoErr) throw new Error(whoErr.message);

    const tenant_key = who?.tenant_key as string | null;
    if (!tenant_key) throw new Error("No tenant_key (select an org in Clerk).");

    const { error } = await supabase.from("assets").insert({
        tenant_key,
        asset_type,
        asset_value,
        tags,
    });

    if (error) throw new Error(error.message);
}
