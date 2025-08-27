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
            { name: "theme-color", content: "#1a1107" },
            { name: "apple-mobile-web-app-capable", content: "yes" },
            { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
            ...seo({ title: "Kumiko", description: `Create stunning Kumiko designs with ease` }),
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "apple-touch-icon", sizes: "180x180", href: "/logo_180.png" },
            { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon_32.png" },
            { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon_16.png" },
            { rel: "icon", href: "/favicon.ico" },
            { rel: "mask-icon", href: "/mask_icon.svg", color: "#ffffff" },
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
