import Link from "next/link";
import { listExposures } from "./actions";

export default async function FindingsPage() {
    const rows = await listExposures();

    return (
        <main className="p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Findings</h1>
                <p className="text-sm text-muted-foreground">
                    Read-only view of exposures_current (worker-owned).
                </p>
            </header>

            <section className="rounded-xl border p-4">
                {rows.length === 0 ? (
                    <div className="p-6 space-y-2">
                        <h1 className="text-xl font-semibold">Findings</h1>
                        <p className="text-sm text-muted-foreground">
                            No findings yet. Run a scan to generate findings.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left">
                                <tr className="border-b">
                                    <th className="py-2 pr-4">Bucket</th>
                                    <th className="py-2 pr-4">Fingerprint</th>
                                    <th className="py-2 pr-4">Host</th>
                                    <th className="py-2 pr-4">Port</th>
                                    <th className="py-2 pr-4">Severity</th>
                                    <th className="py-2 pr-4">State</th>
                                    <th className="py-2 pr-4">Last seen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.identity_key} className="border-b">
                                        <td className="py-2 pr-4">{r.risk_bucket}</td>
                                        <td className="py-2 pr-4">
                                            <Link
                                                className="underline"
                                                href={`/findings/${encodeURIComponent(r.identity_key)}`}
                                            >
                                                {r.fingerprint ?? r.identity_key}
                                            </Link>
                                        </td>
                                        <td className="py-2 pr-4 font-mono">
                                            {r.observed_host ?? "-"}
                                        </td>
                                        <td className="py-2 pr-4">{r.port ?? "-"}</td>
                                        <td className="py-2 pr-4">{r.severity}</td>
                                        <td className="py-2 pr-4">{r.state}</td>
                                        <td className="py-2 pr-4">
                                            {r.last_seen ? new Date(r.last_seen).toLocaleString() : "-"}
                                        </td>
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
