"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function listExposures(limit = 200) {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
        .from("exposures_current")
        .select(
            "identity_key,fingerprint,risk_bucket,observed_host,port,severity,state,last_seen"
        )
        .order("last_seen", { ascending: false })
        .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function getExposure(identity_key: string) {
    const supabase = await supabaseServer();

    const { data, error } = await supabase
        .from("exposures_current")
        .select(
            "identity_key,fingerprint,risk_bucket,severity,observed_host,port,state,last_seen,first_seen"
        )
        .eq("identity_key", identity_key)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data; // null => not visible via RLS / not found
}
