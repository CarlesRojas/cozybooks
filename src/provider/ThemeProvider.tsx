"use client";

import { ThemeProvider as ThemeProviderInternal } from "next-themes";
import { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

const ThemeProvider = ({ children }: Props) => {
    return (
        <ThemeProviderInternal attribute="class" defaultTheme="system" enableSystem>
            {children}
        </ThemeProviderInternal>
    );
};

export default ThemeProvider;
