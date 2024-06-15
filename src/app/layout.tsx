import { QueryProvider } from "@/provider/QueryProvider";
import ThemeProvider from "@/provider/ThemeProvider";
import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

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

export default function RootLayout({ children }: Readonly<Props>) {
    return (
        <html lang="en">
            <QueryProvider>
                <body className={`${montserrat.className} bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-stone-50`}>
                    <ThemeProvider>{children}</ThemeProvider>
                </body>
            </QueryProvider>
        </html>
    );
}
