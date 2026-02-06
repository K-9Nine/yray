"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AddNoteForm({
    identityKey,
    action,
}: {
    identityKey: string;
    action: (identityKey: string, formData: FormData) => Promise<void>;
}) {
    return (
        <form action={action.bind(null, identityKey)} className="space-y-2">
            <input type="hidden" name="action_type" value="add_note" />
            <Textarea name="note" placeholder="Add a note…" />
            <Button type="submit">Add note</Button>
        </form>
    );
}
