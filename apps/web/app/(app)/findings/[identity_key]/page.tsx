import { notFound } from "next/navigation";
import { getExposure } from "../actions";
import { addExposureActionFromForm, listExposureActions } from "./actions";

export default async function ExposureDetailPage({ params }: { params: Promise<{ identity_key: string }> }) {
    const { identity_key } = await params;
    const key = decodeURIComponent(identity_key);
    const exposure = await getExposure(key);

    if (!exposure) {
        return (
            <div className="p-6 space-y-2">
                <h1 className="text-lg font-semibold">Exposure not available</h1>
                <p className="text-sm text-muted-foreground">
                    This exposure doesn’t exist, or it isn’t visible in the current organisation.
                </p>
                <p className="text-xs text-muted-foreground break-all">{key}</p>
            </div>
        );
    }

    const actions = await listExposureActions(key);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">{exposure.fingerprint ?? exposure.identity_key}</h1>
                <div className="text-sm text-muted-foreground">
                    {exposure.risk_bucket} · {exposure.severity} · {exposure.observed_host} · {exposure.port}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <form action={addExposureActionFromForm.bind(null, key)}>
                    <input type="hidden" name="action_type" value="suppress" />
                    <button type="submit" className="px-3 py-2 rounded border">Suppress</button>
                </form>

                <form action={addExposureActionFromForm.bind(null, key)}>
                    <input type="hidden" name="action_type" value="unsuppress" />
                    <button type="submit" className="px-3 py-2 rounded border">Unsuppress</button>
                </form>

                <form action={addExposureActionFromForm.bind(null, key)}>
                    <input type="hidden" name="action_type" value="mark_in_progress" />
                    <button type="submit" className="px-3 py-2 rounded border">Mark in progress</button>
                </form>

                <form action={addExposureActionFromForm.bind(null, key)}>
                    <input type="hidden" name="action_type" value="verify_fix" />
                    <button type="submit" className="px-3 py-2 rounded border">Request verify</button>
                </form>

                <form action={addExposureActionFromForm.bind(null, key)}>
                    <input type="hidden" name="action_type" value="mark_false_positive" />
                    <button type="submit" className="px-3 py-2 rounded border">False positive</button>
                </form>
            </div>

            <div className="space-y-2">
                <h2 className="text-base font-semibold">Add note</h2>
                <form action={addExposureActionFromForm.bind(null, key)} className="space-y-2">
                    <input type="hidden" name="action_type" value="add_note" />
                    <textarea name="note" className="w-full min-h-[90px] rounded border p-2" />
                    <button type="submit" className="px-3 py-2 rounded border">Save note</button>
                </form>
            </div>

            <div className="space-y-2">
                <h2 className="text-base font-semibold">Activity</h2>
                <div className="rounded border divide-y">
                    {actions.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">No actions yet.</div>
                    ) : (
                        actions.map((a) => (
                            <div key={a.id} className="p-3 text-sm">
                                <div className="font-medium">{a.action_type}</div>
                                <div className="text-muted-foreground">
                                    {a.created_at} {a.actor_user_id ? `· ${a.actor_user_id}` : ""}
                                </div>
                                {a.note ? <div className="mt-1">{a.note}</div> : null}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
