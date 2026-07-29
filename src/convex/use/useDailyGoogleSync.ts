// Kicks off the daily CozyBooks <-> Google Books reconciliation when the app opens
// (see convex/googleSync.ts). Fire-and-forget: the server enforces the once-per-day
// limit atomically, so extra calls from reloads or other tabs are cheap no-ops, and
// imported changes flow into the UI by themselves through the reactive queries.

import { api } from "@convex/_generated/api";
import { useAction } from "convex/react";
import { useEffect } from "react";

// Module-level so React strict-mode double effects and layout remounts within one
// page load don't trigger extra calls.
let requested = false;

interface Props {
    userId: string | undefined;
    googleToken: string | null | undefined;
}

export const useDailyGoogleSync = ({ userId, googleToken }: Props) => {
    const run = useAction(api.googleSync.run);

    useEffect(() => {
        if (requested || !userId || !googleToken) return;
        requested = true;

        run({ userId, googleToken })
            .then((summary) => {
                if (!summary.skipped) console.info("Google Books daily sync:", summary);
            })
            .catch((error) => console.error("Google Books daily sync failed", error));
    }, [userId, googleToken, run]);
};
