import { supabaseServer } from "@/lib/supabase/server";
import OrgSwitcher from "./OrgSwitcher";
import { seedAsset, createScanJobBaseline } from "./actions";

export default async function Page() {
    const supabase = await supabaseServer();

    const { data: whoami, error: whoamiErr } = await supabase
        .rpc("xray_whoami"); // we'll add this RPC in Step 2.4

    const { data: assets, error: assetsErr } = await supabase
        .from("assets")
        .select("id, tenant_key, asset_type, asset_value, tags, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

    const { data: jobs, error: jobsErr } = await supabase
        .from("scan_jobs")
        .select("id, tenant_key, scan_id, status, scan_profile, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-xl font-semibold">RLS Smoke Test</h1>

            <OrgSwitcher />

            <div className="flex gap-4">
                <form action={seedAsset}>
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Seed test asset
                    </button>
                </form>

                <form action={createScanJobBaseline}>
                    <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Create baseline scan job
                    </button>
                </form>
            </div>

            <div>
                <h2 className="font-medium">whoami</h2>
                <pre className="text-sm bg-muted p-3 rounded">
                    {JSON.stringify(whoamiErr ?? whoami, null, 2)}
                </pre>
            </div>

            <div>
                <h2 className="font-medium">assets (should be only your org)</h2>
                <pre className="text-sm bg-muted p-3 rounded">
                    {JSON.stringify(assetsErr ?? assets, null, 2)}
                </pre>
            </div>

            <div>
                <h2 className="font-medium">scan_jobs (should be only your org)</h2>
                <pre className="text-sm bg-muted p-3 rounded">
                    {JSON.stringify(jobsErr ?? jobs, null, 2)}
                </pre>
            </div>
        </div>
    );
}
