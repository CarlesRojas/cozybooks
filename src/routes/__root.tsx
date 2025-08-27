import type { Context } from "@/lib/context";
import { seo } from "@/lib/seo";
import { getUser } from "@/server/repo/auth";
import appCss from "@/style.css?url";
import { QueryKey } from "@/type/QueryKey";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { ReactNode } from "react";

export const Route = createRootRouteWithContext<Context>()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
            { name: "theme-color", content: "#0a0a0a" },
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
        const user = await context.queryClient.fetchQuery({ queryKey: [QueryKey.USER], queryFn: getUser });

        return { user };
    },

    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>

            <body className="font-montserrat">
                {children}

                <Scripts />
            </body>
        </html>
    );
}
