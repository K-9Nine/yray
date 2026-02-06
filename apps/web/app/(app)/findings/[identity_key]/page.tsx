import { getExposure } from "../actions";
import { addExposureActionFromForm, listExposureActions } from "./actions";
import { ExposureActionButton } from "./_components/ExposureActionButton";
import { AddNoteForm } from "./_components/AddNoteForm";

export default async function FindingDetailPage(props: { params: Promise<{ identity_key: string }> }) {
    const { identity_key } = await props.params;

    const exposure = await getExposure(identity_key);
    const actions = await listExposureActions(identity_key);

    return (
        <main className="p-6 space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Finding</h1>
                <p className="text-sm text-muted-foreground font-mono break-all">{identity_key}</p>
            </header>

            <section className="rounded-xl border p-4 space-y-2">
                <div className="text-sm">
                    <div><span className="font-medium">Bucket:</span> {exposure.risk_bucket}</div>
                    <div><span className="font-medium">Severity:</span> {exposure.severity}</div>
                    <div><span className="font-medium">State:</span> {exposure.state}</div>
                    <div><span className="font-medium">Host:</span> {exposure.observed_host ?? exposure.observed_ip ?? "-"}</div>
                    <div><span className="font-medium">Port:</span> {exposure.port ?? "-"}</div>
                    <div><span className="font-medium">Title:</span> {exposure.title ?? "-"}</div>
                </div>
            </section>

            <section className="rounded-xl border p-4 space-y-3">
                <h2 className="font-medium">Actions</h2>

                <div className="flex gap-3 flex-wrap">
                    <ExposureActionButton
                        identityKey={identity_key}
                        actionType="suppress"
                        label="Suppress"
                        action={addExposureActionFromForm}
                    />
                    <ExposureActionButton
                        identityKey={identity_key}
                        actionType="unsuppress"
                        label="Unsuppress"
                        action={addExposureActionFromForm}
                    />
                    <ExposureActionButton
                        identityKey={identity_key}
                        actionType="mark_in_progress"
                        label="Mark in progress"
                        action={addExposureActionFromForm}
                    />
                    <ExposureActionButton
                        identityKey={identity_key}
                        actionType="verify_fix"
                        label="Request verify"
                        action={addExposureActionFromForm}
                    />
                    <ExposureActionButton
                        identityKey={identity_key}
                        actionType="mark_false_positive"
                        label="False positive"
                        action={addExposureActionFromForm}
                        variant="destructive"
                    />
                </div>

                <div className="pt-2 max-w-lg">
                    <AddNoteForm identityKey={identity_key} action={addExposureActionFromForm} />
                </div>
            </section>

            <section className="rounded-xl border p-4">
                <h2 className="font-medium mb-3">Recent actions</h2>
                {actions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No actions yet.</div>
                ) : (
                    <ul className="text-sm space-y-2">
                        {actions.map((a: any) => (
                            <li key={a.id} className="border rounded-md p-2">
                                <div className="font-mono">{a.action_type}</div>
                                <div className="text-muted-foreground">
                                    {new Date(a.created_at).toLocaleString()} {a.note ? `— ${a.note}` : ""}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
