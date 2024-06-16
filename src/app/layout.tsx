import "@/app/animation.css";
import "@/app/global.css";
import Navigation from "@/component/Navigation";
import AuthProvider from "@/provider/AuthProvider";
import { QueryProvider } from "@/provider/QueryProvider";
import ThemeProvider from "@/provider/ThemeProvider";
import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import { ReactNode } from "react";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CozyBooks",
    description: "", // TODO Add description
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f5f5f4" },
        { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
    ],
};

interface Props {
    children: ReactNode;
}

const RootLayout = async ({ children }: Readonly<Props>) => (
    <html lang="en" suppressHydrationWarning>
        <head>
            <Script src="https://flackr.github.io/scroll-timeline/dist/scroll-timeline.js" />
        </head>

        <QueryProvider>
            <AuthProvider>
                <body className={`${montserrat.className} overflow-y-auto bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-stone-50`}>
                    <ThemeProvider>
                        {children}

                        <Navigation />
                    </ThemeProvider>
                </body>
            </AuthProvider>
        </QueryProvider>
    </html>
);

export default RootLayout;
