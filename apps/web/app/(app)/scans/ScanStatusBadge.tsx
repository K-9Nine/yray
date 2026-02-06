export function ScanStatusBadge({ status }: { status: string }) {
    const cls =
        status === "completed"
            ? "bg-green-50 text-green-700 border-green-200"
            : status === "failed"
                ? "bg-red-50 text-red-700 border-red-200"
                : status === "running" || status === "started"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : status === "claimed"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-slate-50 text-slate-700 border-slate-200";

    return (
        <span className={`inline-flex items-center px-2 py-1 text-xs rounded border ${cls}`}>
            {status}
        </span>
    );
}
