import { listScanJobs, queueBaselineScan } from "./actions";

export default async function ScansPage() {
    const jobs = await listScanJobs();

    return (
        <main className="p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Scans</h1>
                <p className="text-sm text-muted-foreground">
                    Queue scans. The UI can only insert jobs; workers/service role update status.
                </p>
            </header>

            <section className="rounded-xl border p-4">
                <form action={queueBaselineScan}>
                    <button className="border rounded-md px-3 py-2 hover:bg-accent">
                        Queue baseline scan
                    </button>
                </form>
            </section>

            <section className="rounded-xl border p-4">
                <h2 className="font-medium mb-3">Recent scan jobs</h2>

                {jobs.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No jobs yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left">
                                <tr className="border-b">
                                    <th className="py-2 pr-4">Job</th>
                                    <th className="py-2 pr-4">Profile</th>
                                    <th className="py-2 pr-4">Status</th>
                                    <th className="py-2 pr-4">Claimed</th>
                                    <th className="py-2 pr-4">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map(j => (
                                    <tr key={j.id} className="border-b">
                                        <td className="py-2 pr-4 font-mono">{j.id.slice(0, 8)}…</td>
                                        <td className="py-2 pr-4">{j.scan_profile}</td>
                                        <td className="py-2 pr-4">{j.status}</td>
                                        <td className="py-2 pr-4">{j.claimed_by ? `${j.claimed_by}` : "-"}</td>
                                        <td className="py-2 pr-4">{new Date(j.created_at).toLocaleString()}</td>
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
