console.log("Script loaded");
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const WORKER_ID = "worker-local-1";

async function main() {
    console.log("Starting worker smoke test...");
    // 0) Create a job to claim
    const tenantKey = "org_smoke_test_" + Date.now();
    const { data: scan, error: scanErr } = await supabase
        .from("scans")
        .insert({
            tenant_key: tenantKey,
            scan_kind: "on_demand",
            scan_profile: "baseline",
            status: "queued"
        })
        .select()
        .single();
    if (scanErr) throw scanErr;

    const { data: createdJob, error: createErr } = await supabase
        .from("scan_jobs")
        .insert({
            tenant_key: tenantKey,
            scan_id: scan.id,
            status: "queued",
            scan_profile: "baseline"
        })
        .select()
        .single();
    if (createErr) throw createErr;
    console.log("Created job:", createdJob.id);

    // 1) claim a job
    const { data: job, error: claimErr } = await supabase
        .rpc("claim_next_scan_job", { worker_id: WORKER_ID });

    if (claimErr) throw claimErr;
    if (!job) {
        console.log("No queued jobs to claim.");
        return;
    }

    console.log("Full job object:", job);
    console.log("Claimed job:", job.id, job.tenant_key, job.scan_id);

    // 2) write a dummy exposure_current (adjust column names to your schema!)
    const dummyIdentity = "idk_dummy_test_identity_key";

    const { error: expErr } = await supabase
        .from("exposures_current")
        .insert({
            tenant_key: job.tenant_key,
            identity_key: dummyIdentity,
            risk_bucket: "RB1",
            severity: "high",
            status: "open",
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            evidence: { note: "worker smoke test" },
            proto: "tcp",
            port: 22,
            observed_host: "example.com",
            fingerprint: "dummy_fingerprint_123"
        });

    if (expErr) throw expErr;

    // 3) write an event
    const { error: evtErr } = await supabase
        .from("exposure_events")
        .insert({
            tenant_key: job.tenant_key,
            identity_key: dummyIdentity,
            scan_id: job.scan_id,
            event_type: "new",
            evidence_after: { note: "after" },
            note: "worker smoke test",
        });

    if (evtErr) throw evtErr;

    // 4) mark job complete
    const { data: done, error: doneErr } = await supabase
        .from("scan_jobs")
        .update({
            status: "completed",
            finished_at: new Date().toISOString()
        })
        .eq("id", job.id)
        .select()
        .single();

    if (doneErr) throw doneErr;

    console.log("Completed job:", done.id, done.status);
}

main().catch((e) => {
    console.error("Smoke test failed:", e);
    process.exit(1);
});
