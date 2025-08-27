import Navigation from "@/component/Navigation";
import { Sort } from "@/component/SortMenu";
import type { Context } from "@/lib/context";
import { seo } from "@/lib/seo";
import { ThemeProvider } from "@/lib/theme";
import { getUser } from "@/server/repo/auth";
import appCss from "@/style.css?url";
import { QueryKey } from "@/type/QueryKey";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { ReactNode } from "react";
import z from "zod";

const finishedSearchParamsSchema = z.object({
    sort: z.nativeEnum(Sort).default(Sort.DATE),
});

export const Route = createRootRouteWithContext<Context>()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
            { name: "theme-color", media: "(prefers-color-scheme: light)", content: "#fafafa" },
            { name: "theme-color", media: "(prefers-color-scheme: dark)", content: "#0a0a0a" },
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
        return await context.queryClient.fetchQuery({ queryKey: [QueryKey.USER], queryFn: getUser });
    },

    shellComponent: RootDocument,

    validateSearch: zodValidator(finishedSearchParamsSchema),
});

function RootDocument({ children }: { children: ReactNode }) {
    const { user, queryClient } = Route.useRouteContext();
    const { sort } = Route.useSearch();

    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>

            <body className="font-montserrat relative overflow-y-auto bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
                <ThemeProvider>
                    {children}
                    <Navigation user={user} queryClient={queryClient} sort={sort} />
                </ThemeProvider>

                <Scripts />
            </body>
        </html>
    );
}
