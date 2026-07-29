import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

// Undefined until a Convex deployment is configured (run `npx convex dev` and set
// VITE_CONVEX_URL). The provider and hooks are no-ops without it, so the app keeps
// working on the old server folder until the switch-over.
export const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : undefined;
