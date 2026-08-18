import { DefaultCatchBoundary } from "@/component/error/DefaultCatchBoundary";
import { NotFound } from "@/component/error/NotFound";
import * as Provider from "@/lib/context";
import { routeTree } from "@/routeTree.gen";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

export const getRouter = () => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        const registerServiceWorker = () => {
            navigator.serviceWorker.register("/service-worker.js");
        };

        if (document.readyState === "complete") registerServiceWorker();
        else window.addEventListener("load", registerServiceWorker);
    }

    // Once, and shared with the SSR query integration below: `getContext` builds a
    // fresh QueryClient per call, so asking twice would leave the router hydrating one
    // cache while the integration dehydrated another.
    const context = Provider.getContext();

    const router = createTanstackRouter({
        routeTree,
        // The Convex client is mounted in `__root.tsx` rather than through `Wrap`: it
        // needs the token the root route resolved, and `Wrap` is handed children only.
        context: { ...context, token: undefined, isAuthenticated: false },
        scrollRestoration: true,
        defaultPreloadStaleTime: 0,
        defaultPreload: "intent",
        defaultStructuralSharing: true,
        defaultErrorComponent: DefaultCatchBoundary,
        defaultNotFoundComponent: NotFound,
    });

    setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

    return router;
};

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
