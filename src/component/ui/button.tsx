import { cn } from "@/lib/cn";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

export const buttonVariants = cva(
    "focus-scale inline-flex items-center justify-center text-base font-semibold whitespace-nowrap transition-colors outline-none disabled:pointer-events-none disabled:opacity-30",
    {
        variants: {
            variant: {
                // The brand gradient, on the same 45 degree axis as the washes behind
                // the welcome card and the search field.
                default:
                    "from-brand to-brand-warm hover:from-brand/85 hover:to-brand-warm/85 dark:from-brand/75 dark:to-brand-warm/75 hover:dark:from-brand/90 hover:dark:to-brand-warm/90 rounded-full bg-linear-45 text-neutral-50",
                navigation: "rounded-full text-neutral-600 dark:text-neutral-200",
                glass: "rounded-full bg-neutral-300/70 text-neutral-600 backdrop-blur-md hover:bg-neutral-400/50 hover:text-black dark:bg-neutral-700/60 dark:text-neutral-200 hover:dark:bg-neutral-500/50 hover:dark:text-white",
                ghost: "rounded-full bg-transparent text-neutral-500 hover:text-neutral-950 focus-visible:text-neutral-950 dark:text-neutral-300 hover:dark:text-neutral-50 focus-visible:dark:text-neutral-50",
                pagination: "group focus-visible:scale-125",
                paginationActive: "focus-visible:scale-125",
                link: "font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50",
                input: "bg-neutral-150 dark:bg-neutral-850 rounded-xl hover:bg-neutral-200 hover:dark:bg-neutral-800",
                frost: "data-[checked=true]:bg-brand/80 data-[checked=true]:hover:bg-brand-dark/80 data-[checked=true]:focus-visible:bg-brand-dark/80 dark:data-[checked=true]:bg-brand/80 dark:data-[checked=true]:hover:bg-brand-dark/80 dark:data-[checked=true]:focus-visible:bg-brand-dark/80 rounded-full border border-neutral-500/25 bg-white/50 text-neutral-950 backdrop-blur-md hover:bg-white/80 focus-visible:bg-white/80 data-[checked=true]:text-neutral-50 dark:border-neutral-500/40 dark:bg-black/50 dark:text-white dark:hover:bg-black/80 dark:focus-visible:bg-black/80",
                destructive: "rounded-full bg-red-500/100 text-neutral-50 hover:bg-red-500/80 dark:bg-red-500/50 hover:dark:bg-red-500/70",
                // Reads as the inverse of the page: near-black on the light theme,
                // near-white on the dark one.
                contrast:
                    "rounded-full bg-neutral-950 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-950 hover:dark:bg-neutral-200",
            },
            size: {
                default: "h-12 w-fit px-5 py-3",
                small: "h-9 px-4",
                icon: "h-12 min-h-12 w-12 min-w-12",
                iconSmall: "h-9 min-h-9 w-9 min-w-9",
                ghost: "h-fit w-fit",
                pagination: "h-8 w-8",
            },
        },
        defaultVariants: { variant: "default", size: "default" },
    },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export const Button = ({
    className,
    variant,
    size,
    asChild = false,
    ref,
    ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
};
