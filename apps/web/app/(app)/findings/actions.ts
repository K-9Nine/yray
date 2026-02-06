"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function listExposures() {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
        .from("exposures_current")
        .select("identity_key, risk_bucket, severity, state, observed_host, observed_ip, port, title, last_seen_at")
        .order("last_seen_at", { ascending: false })
        .limit(200);

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function getExposure(identity_key: string) {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
        .from("exposures_current")
        .select("*")
        .eq("identity_key", identity_key)
        .single();

    if (error) throw new Error(error.message);
    return data;
}
