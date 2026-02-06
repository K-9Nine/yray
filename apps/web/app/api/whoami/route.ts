import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const { getToken } = await auth();
    const token = await getToken({ template: "supabase" });

    if (!token) {
        return NextResponse.json({ error: "no token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data, error } = await supabase.rpc("xray_whoami");
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // xray_whoami returns jsonb, supabase-js returns it as object already
    return NextResponse.json(data);
}
