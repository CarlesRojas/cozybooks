import { ConvexClientProvider } from "@/convex/provider";
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
        context: { ...context },
        // Mounts the Convex reactive client above every route match, so the `useQuery`
        // hooks in `src/convex/use/**` find a client. `Wrap` is the router-wide
        // provider slot; ConvexProvider renders no DOM, so it can't skew hydration.
        Wrap: ConvexClientProvider,
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
