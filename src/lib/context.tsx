import { QueryClient } from "@tanstack/react-query";

// One client per call, and `getRouter` calls this once per router — which on the server
// means once per request.
//
// It used to be a module-level singleton, and a module outlives the request: every SSR
// render in the process shared one cache, which `setupRouterSsrQueryIntegration` then
// dehydrates into the html it answers with. One visitor's cached queries could be handed
// to the next, and `fetchQuery` — which dedupes by key — could hand two concurrent
// requests the same in-flight answer.
export const getContext = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: false,
            },
        },
    });

    return { queryClient };
};

export type Context = {
    queryClient: QueryClient;
    // The JWT Convex verifies, resolved once per document — see `src/routes/__root.tsx`.
    // Its presence is what "signed in" means to the router; who that is comes from the
    // token itself, inside Convex.
    token: string | undefined;
    isAuthenticated: boolean;
};
