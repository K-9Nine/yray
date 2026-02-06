"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { ExposureActionType } from "@/lib/constants/exposure-actions";

type Props = {
    identityKey: string;
    actionType: ExposureActionType;
    label: string;
    action: (identityKey: string, formData: FormData) => Promise<void>;
    variant?: React.ComponentProps<typeof Button>["variant"];
};

export function ExposureActionButton({
    identityKey,
    actionType,
    label,
    action,
    variant = "secondary",
}: Props) {
    return (
        <form action={action.bind(null, identityKey)}>
            <input type="hidden" name="action_type" value={actionType} />
            <Button type="submit" variant={variant}>
                {label}
            </Button>
        </form>
    );
}
