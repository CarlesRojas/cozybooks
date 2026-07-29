import { convexClient } from "@/convex/client";
import { ConvexProvider } from "convex/react";
import type { ReactNode } from "react";

// Mounts the Convex reactive client. Renders children untouched while no Convex
// deployment is configured (VITE_CONVEX_URL missing).
export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
    if (!convexClient) return <>{children}</>;
    return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
};
