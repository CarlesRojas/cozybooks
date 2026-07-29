import { convexClient } from "@/convex/client";
import { ConvexProvider } from "convex/react";
import type { ReactNode } from "react";

// Mounts the Convex reactive client above the whole router (wired as the router's
// `Wrap` in `src/router.tsx`). The app reads all of its data through Convex now, so
// a missing deployment URL is a setup error rather than something to degrade past:
// rendering children unwrapped would surface as a misleading "Could not find Convex
// client" from whichever `useQuery` happened to run first.
export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
    if (!convexClient) throw new Error("VITE_CONVEX_URL must be set (note the VITE_ prefix): the app reads its data from Convex");
    return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
};
