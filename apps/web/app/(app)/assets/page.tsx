import { listAssets, addAsset } from "./actions";

export default async function AssetsPage() {
    const assets = await listAssets();

    return (
        <main className="p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Assets</h1>
                <p className="text-sm text-muted-foreground">
                    Add domains, IPs, and CIDRs. All data is tenant-scoped by RLS.
                </p>
            </header>

            <section className="rounded-xl border p-4">
                <h2 className="font-medium mb-3">Add asset</h2>
                <form action={addAsset} className="flex flex-col gap-3 max-w-xl">
                    <div className="flex gap-3">
                        <select name="asset_type" className="border rounded-md px-3 py-2 w-40" defaultValue="domain">
                            <option value="domain">domain</option>
                            <option value="ip">ip</option>
                            <option value="cidr">cidr</option>
                        </select>

                        <input
                            name="asset_value"
                            className="border rounded-md px-3 py-2 flex-1"
                            placeholder="example.com or 203.0.113.10 or 203.0.113.0/24"
                            required
                        />
                    </div>

                    <input
                        name="tags"
                        className="border rounded-md px-3 py-2"
                        placeholder="tags (comma-separated) e.g. prod,public"
                    />

                    <button className="border rounded-md px-3 py-2 w-fit hover:bg-accent">
                        Add asset
                    </button>
                </form>
            </section>

            <section className="rounded-xl border p-4">
                <h2 className="font-medium mb-3">Your assets</h2>

                {assets.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No assets yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left">
                                <tr className="border-b">
                                    <th className="py-2 pr-4">Type</th>
                                    <th className="py-2 pr-4">Value</th>
                                    <th className="py-2 pr-4">Tags</th>
                                    <th className="py-2 pr-4">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map(a => (
                                    <tr key={a.id} className="border-b">
                                        <td className="py-2 pr-4">{a.asset_type}</td>
                                        <td className="py-2 pr-4 font-mono">{a.asset_value}</td>
                                        <td className="py-2 pr-4">{(a.tags ?? []).join(", ")}</td>
                                        <td className="py-2 pr-4">{new Date(a.created_at).toLocaleString()}</td>
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
