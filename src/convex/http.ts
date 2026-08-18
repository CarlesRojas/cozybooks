import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

// Stateless client for one-shot Convex calls outside React (route loaders / beforeLoad,
// which run on the server during SSR and on the client afterwards).
//
// A fresh one per call, and never a shared instance with a token on it: a module outlives
// the request on the server, so an authenticated client held here would hand one
// visitor's identity to the next. The token comes from the route context — see
// `src/routes/__root.tsx`.
export const authedConvexClient = (token: string | undefined) => {
    if (!convexUrl) return undefined;

    const client = new ConvexHttpClient(convexUrl);
    if (token) client.setAuth(token);

    return client;
};

// The one exception: better-auth's own storage adapter, which runs in the app server and
// authenticates with BETTER_AUTH_SECRET rather than a user's token. It has no identity to
// leak.
export const convexHttpClient = convexUrl ? new ConvexHttpClient(convexUrl) : undefined;
