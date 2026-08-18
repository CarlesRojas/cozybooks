import Navigation from "@/component/Navigation";
import { Sort } from "@/component/SortMenu";
import type { Context } from "@/lib/context";
import { seo } from "@/lib/seo";
import { THEME_COLOR, ThemeProvider } from "@/lib/theme";
import { ConvexClientProvider } from "@/convex/provider";
import { getToken } from "@/lib/auth/getToken";
import "@/lib/fontAwesome";
import appCss from "@/style.css?url";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import z from "zod";

// The finished page's view options. No defaults: a default would be written into
// the url of every route the moment anything navigated, and "sort=DATE" in the url
// would be indistinguishable from having asked for nothing — which is what tells
// the finished page whether to fall back to the last view kept in storage.
const finishedSearchParamsSchema = z.object({
    sort: z.nativeEnum(Sort).optional(),
    repeats: z.coerce.boolean().optional(),
});

// How often `beforeLoad` may ask the server is a bigger question here than it looks.
//
// The root route matches every url, and TanStack re-runs `beforeLoad` on every navigation
// and on every *preload* — `defaultPreload: "intent"` means a preload per link hovered.
// A server function in here therefore costs an http round trip per hover, which is what
// resolving the session that way used to do: two `betterAuth.findMany` calls, every time,
// to re-confirm something that had not changed.
//
// The browser can answer it itself. The session cannot change without a document load:
// signing in leaves for Google and comes back as a fresh page, and signing out sets
// `window.location` (see `Settings.tsx`). So within one document the answer is fixed, and
// asking again on every hover can only ever confirm it.
//
// It is remembered per document — never on the server, where the module outlives the
// request and the next one belongs to somebody else.
//
// The promise rather than the token, so that concurrent navigations share one request
// instead of racing to make their own.
let clientToken: { value: Promise<string | undefined> } | undefined;

const isBrowser = () => typeof document !== "undefined";

const resolveToken = async () => {
    if (!isBrowser()) return await getToken();

    clientToken ??= { value: getToken() };
    return await clientToken.value;
};

// Seeded from the context the server already resolved, so the first hover of the document
// does not pay for an answer that arrived with the html. Both write the same box, so
// whichever gets there first wins and the other is a no-op.
const rememberToken = (token: string | undefined) => {
    if (!isBrowser()) return;
    clientToken ??= { value: Promise.resolve(token) };
};

export const Route = createRootRouteWithContext<Context>()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content",
            },
            // The colour of the status bar above the Android app. Light because that is
            // what a document with no `dark` class on it renders as; `ThemeProvider`
            // replaces it with the chosen theme's colour before the first paint, and on
            // every change after — see `applyThemeColor`.
            { name: "theme-color", content: THEME_COLOR.light },
            { name: "apple-mobile-web-app-capable", content: "yes" },
            { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
            ...seo({
                title: "CozyBooks",
                description: `The best way to keep track of all the books you have and enjoy all the ones you want to read.`,
            }),
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "apple-touch-icon", sizes: "180x180", href: "/appleIcon180.png" },
            { rel: "icon", href: "/favicon.ico" },
            { rel: "manifest", href: "/manifest.json" },
        ],
    }),

    beforeLoad: async () => {
        const token = await resolveToken();

        // What "signed in" means to the router. Who that is is not decided here at all:
        // the token says so, Convex verifies it, and every function reads the user off
        // the identity — see `convex/lib/auth.ts`.
        return { token, isAuthenticated: !!token };
    },

    shellComponent: RootDocument,

    validateSearch: finishedSearchParamsSchema,
});

function RootDocument({ children }: { children: ReactNode }) {
    const { token, isAuthenticated } = Route.useRouteContext();
    const { sort, repeats } = Route.useSearch();

    // During render rather than in an effect, so it is in place before anything can
    // navigate or hover. It only ever fills an empty box, so it is safe to repeat.
    rememberToken(token);

    return (
        // The FOUC script in ThemeProvider toggles `dark` on <html> before React
        // hydrates, so this element is expected to differ from the SSR output.
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>

            <body className="font-montserrat relative overflow-y-auto bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
                <ConvexClientProvider initialToken={token}>
                    <ThemeProvider>
                        {children}
                        <Navigation isAuthenticated={isAuthenticated} sort={sort} repeats={repeats} />
                    </ThemeProvider>
                </ConvexClientProvider>

                <Scripts />
            </body>
        </html>
    );
}
