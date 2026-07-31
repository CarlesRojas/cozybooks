import { convexClient } from "@/convex/client";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { ConvexProvider } from "convex/react";
import type { ReactNode } from "react";

// How long a query keeps its subscription after the last component using it
// unmounts. Convex ties subscriptions to component lifetime, so leaving a page
// throws its data away and coming back re-fetches from nothing — which is why
// switching tabs re-ran every list. Holding the subscription open means the data is
// already there on the way back, and stayed live while away, so it is current rather
// than merely cached.
const QUERY_CACHE_MS = 10 * 60 * 1000;

// Mounts the Convex reactive client above the whole router (wired as the router's
// `Wrap` in `src/router.tsx`). The app reads all of its data through Convex now, so
// a missing deployment URL is a setup error rather than something to degrade past:
// rendering children unwrapped would surface as a misleading "Could not find Convex
// client" from whichever `useQuery` happened to run first.
export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
    if (!convexClient) throw new Error("VITE_CONVEX_URL must be set (note the VITE_ prefix): the app reads its data from Convex");

    return (
        <ConvexProvider client={convexClient}>
            <ConvexQueryCacheProvider expiration={QUERY_CACHE_MS}>{children}</ConvexQueryCacheProvider>
        </ConvexProvider>
    );
};
