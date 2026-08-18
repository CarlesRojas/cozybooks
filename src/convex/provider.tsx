import { convexClient } from "@/convex/client";
import { authClient } from "@/lib/auth/client";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { ConvexProviderWithAuth } from "convex/react";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";

// How long a query keeps its subscription after the last component using it
// unmounts. Convex ties subscriptions to component lifetime, so leaving a page
// throws its data away and coming back re-fetches from nothing — which is why
// switching tabs re-ran every list. Holding the subscription open means the data is
// already there on the way back, and stayed live while away, so it is current rather
// than merely cached.
const QUERY_CACHE_MS = 10 * 60 * 1000;

// The SSR token, handed to the hook below. `useAuth` is a hook and takes no arguments, so
// the value reaches it through context rather than a prop.
const InitialTokenContext = createContext<string | undefined>(undefined);

// Mints a token from the session cookie. `/api/auth/token` answers only for a live
// session, so a signed-out call comes back without one and Convex stays anonymous.
const fetchToken = async () => {
    const response = await fetch("/api/auth/token", { credentials: "include" });
    if (!response.ok) return null;

    const { token } = (await response.json()) as { token?: string };
    return token ?? null;
};

const useBetterAuth = () => {
    const initialToken = useContext(InitialTokenContext);
    const session = authClient.useSession();

    // The token SSR already minted answers the first ask, which is the one Convex makes
    // as it authenticates the socket on load. Without this every document paid for two
    // tokens a few hundred milliseconds apart — one rendered into the page, one fetched
    // right back — each a signature and a session check on the server. It is good for
    // the hour it was minted for, and Convex asks again as that runs out.
    //
    // Spent once, hence the ref: a later ask is a later ask, and `forceRefreshToken` —
    // which Convex sets when the socket rejects what it holds — skips it outright.
    const unspentToken = useRef(initialToken);

    const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
        const token = unspentToken.current;
        unspentToken.current = undefined;

        if (!forceRefreshToken && token) return token;
        return await fetchToken();
    }, []);

    // Before the session query has answered, the token SSR resolved still stands. Without
    // that the first paint after a full page load is signed out for as long as the round
    // trip takes, and the server rendered it signed in — which is also a hydration
    // mismatch.
    const settled = !session.isPending;
    const isAuthenticated = settled ? !!session.data : !!initialToken;

    return useMemo(
        () => ({ isLoading: !settled && !initialToken, isAuthenticated, fetchAccessToken }),
        [settled, initialToken, isAuthenticated, fetchAccessToken],
    );
};

interface Props {
    initialToken: string | undefined;
    children: ReactNode;
}

// Mounts the Convex reactive client above the whole app and keeps its token fresh, so
// `ctx.auth.getUserIdentity()` resolves inside every Convex function and ownership is
// enforced there rather than asserted by the browser.
//
// The app reads all of its data through Convex, so a missing deployment URL is a setup
// error rather than something to degrade past: rendering children unwrapped would
// surface as a misleading "Could not find Convex client" from whichever `useQuery`
// happened to run first.
export const ConvexClientProvider = ({ initialToken, children }: Props) => {
    if (!convexClient) throw new Error("VITE_CONVEX_URL must be set (note the VITE_ prefix): the app reads its data from Convex");

    return (
        <InitialTokenContext.Provider value={initialToken}>
            <ConvexProviderWithAuth client={convexClient} useAuth={useBetterAuth}>
                <ConvexQueryCacheProvider expiration={QUERY_CACHE_MS}>{children}</ConvexQueryCacheProvider>
            </ConvexProviderWithAuth>
        </InitialTokenContext.Provider>
    );
};
