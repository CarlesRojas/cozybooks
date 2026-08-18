import type { getUser } from "@/lib/auth/getUser";
import { QueryClient } from "@tanstack/react-query";

// One client per call, and `getRouter` calls this once per router — which on the
// server means once per request.
//
// It used to be a module-level singleton, and a module outlives the request: every
// SSR render in the process shared one cache, and `setupRouterSsrQueryIntegration`
// dehydrates that cache into the html it answers with. So one visitor's cached
// queries could be handed to the next, and `fetchQuery` — which dedupes by key —
// could hand two concurrent requests the same in-flight answer. It stayed invisible
// only because nothing had a stale time: every read went back to the server anyway.
// The user query in `src/routes/__root.tsx` does have one now, and with a shared
// cache that read as "signed out" for five minutes after any signed-out request —
// including the one that came back from Google, which is what made signing in look
// like it silently failed.
export const getContext = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: false,
            },
        },
    });

    return { queryClient, user: null };
};

export type Context = {
    queryClient: QueryClient;
    user: NonNullable<Awaited<ReturnType<typeof getUser>>>["user"] | null;
};
