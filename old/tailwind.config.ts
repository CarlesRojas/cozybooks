import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: ["./src/**/*.{ts,tsx}"],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: { "2xl": "1400px" },
        },
        extend: {
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
            screens: {
                mouse: { raw: "(hover: hover)" },
            },
            colors: {
                "neutral-150": "#F1F1F1",
                "neutral-850": "#1B1B1B",
            },
            aspectRatio: {
                book: "2 / 3",
            },
            transitionDuration: {
                "2000": "2000ms",
            },
            typography: { DEFAULT: { css: { p: { marginTop: "0.75em", marginBottom: "0.75em" } } } },
        },
    },
    plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
