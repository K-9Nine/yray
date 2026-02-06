import { listRecentScanJobs, queueBaselineScanForAllAssets } from "./actions";
import { ScanStatusBadge } from "./ScanStatusBadge";

export default async function ScansPage() {
    const jobs = await listRecentScanJobs(25);

    return (
        <main className="p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Scans</h1>
                <p className="text-sm text-muted-foreground">
                    Queue scans (UI-owned) and view scan_jobs (read-only).
                </p>
            </header>

            <section className="rounded-xl border p-4 space-y-3">
                <h2 className="text-base font-medium">Queue scan</h2>

                <form action={queueBaselineScanForAllAssets}>
                    <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                    >
                        Queue baseline scan (all assets)
                    </button>
                </form>

                <p className="text-xs text-muted-foreground">
                    This creates rows in <code>scans</code> and <code>scan_jobs</code>. Worker claims jobs separately.
                </p>
            </section>

            <section className="rounded-xl border p-4 space-y-2">
                <h2 className="text-base font-medium">Run worker smoke test</h2>
                <p className="text-sm text-muted-foreground">
                    This runs a local script that claims the next scan job and writes dummy results/events into Supabase
                    using the <span className="font-mono">service role</span>.
                </p>

                <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">
                    {`# from repo root
node scripts/worker-smoke-test.mjs --env .env.worker.local`}
                </pre>

                <p className="text-xs text-muted-foreground">
                    Expected: the newest scan job moves to <span className="font-mono">completed</span> and you’ll see a test exposure in Findings.
                </p>
            </section>

            <section className="rounded-xl border p-4">
                <h2 className="text-base font-medium mb-3">Recent jobs</h2>

                {jobs.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                        No scan jobs yet. Queue one above, then run the worker.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left">
                                <tr className="border-b">
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Profile</th>
                                    <th className="py-2 pr-4">Claimed by</th>
                                    <th className="py-2 pr-4">Attempts</th>
                                    <th className="py-2 pr-4">Created</th>
                                    <th className="py-2 pr-4">Updated</th>
                                    <th className="py-2 pr-4">Last error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((j) => (
                                    <tr key={j.id} className="border-b">
                                        <td className="py-2 pr-4">
                                            <ScanStatusBadge status={j.status} />
                                            {j.status === "failed" && j.last_error ? (
                                                <div className="mt-1 text-xs text-red-600 whitespace-pre-wrap max-w-xs break-words">
                                                    {j.last_error}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td className="py-2 pr-4">{j.scan_profile}</td>
                                        <td className="py-2 pr-4 font-mono">{j.claimed_by ?? "-"}</td>
                                        <td className="py-2 pr-4">{j.attempts ?? 0}</td>
                                        <td className="py-2 pr-4">{new Date(j.created_at).toLocaleString()}</td>
                                        <td className="py-2 pr-4">{new Date(j.updated_at).toLocaleString()}</td>
                                        <td className="py-2 pr-4">{j.last_error ?? "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
