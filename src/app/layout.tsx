import "@/app/animation.css";
import "@/app/global.css";
import Navigation from "@/component/Navigation";
import AuthProvider from "@/provider/AuthProvider";
import { QueryProvider } from "@/provider/QueryProvider";
import ThemeProvider from "@/provider/ThemeProvider";
import type { Metadata, Viewport } from "next";
import { ViewTransitions } from "next-view-transitions";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import { ReactNode } from "react";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CozyBooks",
    description: "The best way to keep track of all the books you have and enjoy all the ones you want to read.",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fafafa" },
        { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    ],
};

interface Props {
    children: ReactNode;
}

const RootLayout = async ({ children }: Readonly<Props>) => (
    <ViewTransitions>
        <html lang="en" suppressHydrationWarning>
            <head>
                <Script src="https://flackr.github.io/scroll-timeline/dist/scroll-timeline.js" />
            </head>

            <QueryProvider>
                <AuthProvider>
                    <body
                        className={`${montserrat.className} relative overflow-y-auto bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50`}
                    >
                        <ThemeProvider>
                            {children}

                            <Navigation />
                        </ThemeProvider>
                    </body>
                </AuthProvider>
            </QueryProvider>
        </html>
    </ViewTransitions>
);

export default RootLayout;
