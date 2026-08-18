import Navigation from "@/component/Navigation";
import { Sort } from "@/component/SortMenu";
import type { Context } from "@/lib/context";
import { seo } from "@/lib/seo";
import { THEME_COLOR, ThemeProvider } from "@/lib/theme";
import { getUser } from "@/lib/auth/getUser";
import "@/lib/fontAwesome";
import appCss from "@/style.css?url";
import { QueryKey } from "@/type/QueryKey";
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

    beforeLoad: async ({ context }) => {
        // How often this may ask the server is a bigger question here than it looks.
        // The root route matches every url, and TanStack re-runs `beforeLoad` on every
        // navigation and on every *preload* — `defaultPreload: "intent"` means a preload
        // per link hovered. Without a stale time the query is stale the moment it
        // resolves, so `fetchQuery` went back to `getUser` every single time: a server
        // round trip per hover, and two `betterAuth.findMany` calls behind it.
        //
        // Who is signed in cannot change under the app without something invalidating
        // this key: signing in leaves for Google and comes back as a fresh document,
        // and signing out invalidates it by hand (see `Settings.tsx`) before asking the
        // router to reload. So within the window the cached answer is the answer.
        //
        // Five minutes. A session revoked on another device outlives itself by up to
        // that long in this tab, which for a reading list is nothing.
        const result = await context.queryClient.fetchQuery({
            queryKey: [QueryKey.USER],
            queryFn: getUser,
            staleTime: 5 * 60 * 1000,
        });

        return { user: result.user };
    },

    shellComponent: RootDocument,

    validateSearch: finishedSearchParamsSchema,
});

function RootDocument({ children }: { children: ReactNode }) {
    const { user, queryClient } = Route.useRouteContext();
    const { sort, repeats } = Route.useSearch();

    return (
        // The FOUC script in ThemeProvider toggles `dark` on <html> before React
        // hydrates, so this element is expected to differ from the SSR output.
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>

            <body className="font-montserrat relative overflow-y-auto bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
                <ThemeProvider>
                    {children}
                    <Navigation user={user} queryClient={queryClient} sort={sort} repeats={repeats} />
                </ThemeProvider>

                <Scripts />
            </body>
        </html>
    );
}
