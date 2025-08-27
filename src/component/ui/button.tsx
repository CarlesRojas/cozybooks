import { cn } from "@/lib/cn";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

const buttonVariants = cva(
    "focus-scale inline-flex items-center justify-center text-base font-semibold whitespace-nowrap transition-colors outline-none disabled:pointer-events-none disabled:opacity-30",
    {
        variants: {
            variant: {
                default:
                    "mouse:hover:dark:bg-purple-500/70 mouse:hover:bg-purple-500/80 rounded-full bg-purple-500/100 text-neutral-50 dark:bg-purple-500/50",
                navigation: "rounded-full text-neutral-600 dark:text-neutral-200",
                glass: "mouse:hover:text-black mouse:hover:dark:text-white mouse:hover:bg-neutral-400/50 mouse:hover:dark:bg-neutral-500/50 rounded-full bg-neutral-300/70 text-neutral-600 backdrop-blur-md dark:bg-neutral-700/60 dark:text-neutral-200",
                ghost: "mouse:text-neutral-500 mouse:dark:text-neutral-300 mouse:focus-visible:text-neutral-950 mouse:focus-visible:dark:text-neutral-50 mouse:hover:text-neutral-950 mouse:hover:dark:text-neutral-50 rounded-full bg-transparent text-neutral-950 dark:text-neutral-50",
                pagination: "group mouse:focus-visible:scale-125",
                paginationActive: "mouse:focus-visible:scale-125",
                link: "mouse:hover:underline font-semibold text-neutral-900 underline-offset-4 dark:text-neutral-50",
                input: "bg-neutral-150 dark:bg-neutral-850 mouse:hover:bg-neutral-200 mouse:hover:dark:bg-neutral-800 rounded-xl",
                destructive:
                    "mouse:hover:dark:bg-red-500/70 mouse:hover:bg-red-500/80 rounded-full bg-red-500/100 text-neutral-50 dark:bg-red-500/50",
            },
            size: {
                default: "h-12 w-fit px-5 py-3",
                small: "h-9 px-4",
                icon: "h-12 min-h-12 w-12 min-w-12",
                ghost: "h-fit w-fit",
                pagination: "h-8 w-8",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
