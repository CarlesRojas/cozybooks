import { ScriptOnce } from "@tanstack/react-router";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";

export type Theme = "dark" | "light" | "system";

// "system" is a way of choosing rather than something to apply: by the time a theme
// reaches the page it is one of the other two.
export type ResolvedTheme = Exclude<Theme, "system">;

const MEDIA = "(prefers-color-scheme: dark)";

// The colour of the page under each theme — `bg-neutral-50 dark:bg-neutral-950` on
// <body>, written out as values because that is what the status bar takes.
export const THEME_COLOR: Record<ResolvedTheme, string> = {
    light: "#fafafa",
    dark: "#0a0a0a",
};

// <meta name="theme-color"> is what paints the status bar above the Android app, and
// the only thing that still can: the app is a Trusted Web Activity, and from Android
// 15 the colour the wrapper asks for is ignored — `Window.setStatusBarColor` is
// deprecated and does nothing, so `themeColor` in android/twa-manifest.json never
// reaches the bar.
//
// It cannot be left to answer the system's setting, which is what a `media` attribute
// on the meta would have it do, because the theme in Settings overrules the system:
// pick Light on a phone that is in dark mode and the page turns light with a black
// bar still above it. Only the theme that actually applies can say what colour the
// page is, so it writes the colour itself.
//
// One is declared, in `__root.tsx`: `name` is the key TanStack files head tags
// under, so a second one there would take the place of the first rather than sit
// beside it. Every one in the document is written all the same. React hydrates the
// head by matching what it rendered against what is there, and a meta already
// carrying a colour it did not render is one it puts a second copy beside instead of
// adopting — which is the ordinary case here, since the theme lives in localStorage
// and the server cannot know it. The bar reads the first, which is ours; writing
// every one keeps the spare from disagreeing with it.
const applyThemeColor = (targetTheme: ResolvedTheme) => {
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => (meta.content = THEME_COLOR[targetTheme]));
};

// The class is only touched when it is not already right, since the script below
// gets there first on a cold load. The colour is written either way, an attribute
// being no cheaper to compare than to set.
const applyTheme = (targetTheme: ResolvedTheme) => {
    const root = window.document.documentElement;

    if (!root.classList.contains(targetTheme)) {
        root.classList.remove("light", "dark");
        root.classList.add(targetTheme);
    }

    applyThemeColor(targetTheme);
};

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "theme", ...props }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (typeof window !== "undefined" ? (localStorage.getItem(storageKey) as Theme) : null) || defaultTheme,
    );

    const handleMediaQuery = useCallback(
        (e: MediaQueryListEvent | MediaQueryList) => {
            if (theme !== "system") return;
            applyTheme(e.matches ? "dark" : "light");
        },
        [theme],
    );

    useEffect(() => {
        const media = window.matchMedia(MEDIA);

        media.addEventListener("change", handleMediaQuery);
        handleMediaQuery(media);

        return () => media.removeEventListener("change", handleMediaQuery);
    }, [handleMediaQuery]);

    useEffect(() => {
        let targetTheme: ResolvedTheme;

        if (theme === "system") {
            localStorage.removeItem(storageKey);
            targetTheme = window.matchMedia(MEDIA).matches ? "dark" : "light";
        } else {
            localStorage.setItem(storageKey, theme);
            targetTheme = theme;
        }

        applyTheme(targetTheme);
    }, [theme, storageKey]);

    const value = useMemo(
        () => ({
            theme,
            setTheme,
        }),
        [theme],
    );

    return (
        <ThemeProviderContext {...props} value={value}>
            <ScriptOnce>
                {/* Apply theme early to avoid FOUC — the status bar with it, so it does not
                    start on the colour of the other theme and correct itself a frame later. */}
                {`(function(){
            var dark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', dark);
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.content = dark ? '${THEME_COLOR.dark}' : '${THEME_COLOR.light}';
            })()`}
            </ScriptOnce>
            {children}
        </ThemeProviderContext>
    );
}

export const useTheme = () => {
    const context = use(ThemeProviderContext);

    return context;
};
