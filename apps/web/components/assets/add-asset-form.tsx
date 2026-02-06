"use client";

import { useState } from "react";
import { useSupabaseClient } from "@/lib/supabase/client";

type AssetType = "domain" | "ip" | "cidr";

export default function AddAssetForm() {
    const supabase = useSupabaseClient();
    const [assetType, setAssetType] = useState<AssetType>("domain");
    const [assetValue, setAssetValue] = useState("");
    const [tags, setTags] = useState("seed");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);

        const tagsArr = tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        const { error } = await supabase.from("assets").insert({
            asset_type: assetType,
            asset_value: assetValue.trim(),
            tags: tagsArr.length ? tagsArr : null,
            // tenant_key is set by DB default OR provided by client depending on your schema.
            // Recommended: DB default tenant_key = xray.requesting_tenant_key()
        });

        setSaving(false);

        if (error) {
            // handle duplicate nicely
            if (error.code === "23505") {
                setError("That asset already exists for this tenant.");
            } else {
                setError(error.message);
            }
            return;
        }

        setAssetValue("");
        // refresh to show new row
        window.location.reload();
    }

    return (
        <form onSubmit={onSubmit} className="rounded-md border p-3 space-y-3">
            <div className="text-sm font-medium">Add asset</div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-3">
                    <label className="text-xs text-muted-foreground">Type</label>
                    <select
                        className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
                        value={assetType}
                        onChange={(e) => setAssetType(e.target.value as AssetType)}
                    >
                        <option value="domain">domain</option>
                        <option value="ip">ip</option>
                        <option value="cidr">cidr</option>
                    </select>
                </div>

                <div className="sm:col-span-6">
                    <label className="text-xs text-muted-foreground">Value</label>
                    <input
                        className="mt-1 w-full rounded-md border px-2 py-2 text-sm font-mono"
                        placeholder="example.com / 203.0.113.10 / 203.0.113.0/24"
                        value={assetValue}
                        onChange={(e) => setAssetValue(e.target.value)}
                        required
                    />
                </div>

                <div className="sm:col-span-3">
                    <label className="text-xs text-muted-foreground">Tags (comma)</label>
                    <input
                        className="mt-1 w-full rounded-md border px-2 py-2 text-sm"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            >
                {saving ? "Adding..." : "Add"}
            </button>

            <div className="text-xs text-muted-foreground">
                RLS enforces tenant isolation. You should never be able to see another org’s assets.
            </div>
        </form>
    );
}
