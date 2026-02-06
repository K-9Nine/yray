"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { assertExposureActionType } from "@/lib/constants/exposure-actions";

export async function listExposureActions(identity_key: string) {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
        .from("exposure_actions")
        .select("id, action_type, actor_user_id, note, created_at")
        .eq("identity_key", identity_key)
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function addExposureActionFromForm(identity_key: string, formData: FormData) {
    const action_type = assertExposureActionType(String(formData.get("action_type") ?? ""));
    const noteRaw = String(formData.get("note") ?? "").trim();

    const supabase = await supabaseServer();

    const { data: who, error: whoErr } = await supabase.rpc("xray_whoami");
    if (whoErr) throw new Error(whoErr.message);

    const tenant_key = who?.tenant_key as string | null;
    const actor_user_id = who?.jwt?.sub as string | null;

    if (!tenant_key) throw new Error("No tenant_key (select an org in Clerk).");
    // If actor_user_id is required in your table, keep this check:
    // if (!actor_user_id) throw new Error("No user id in JWT.");

    const { error } = await supabase.from("exposure_actions").insert({
        tenant_key,
        identity_key,
        action_type,
        actor_user_id: actor_user_id ?? null,
        note: action_type === "add_note" ? (noteRaw || "note") : null,
        metadata: {}, // optional
    });

    if (error) throw new Error(error.message);

    revalidatePath(`/findings/${encodeURIComponent(identity_key)}`);
}
