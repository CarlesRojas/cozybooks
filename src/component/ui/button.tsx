import { cn } from "@/lib/cn";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

const buttonVariants = cva(
    "focus-scale inline-flex items-center justify-center whitespace-nowrap text-base font-semibold outline-none transition-colors disabled:pointer-events-none disabled:opacity-30",
    {
        variants: {
            variant: {
                default:
                    "rounded-full bg-purple-500/100 text-neutral-50 hover:bg-purple-500/80 dark:bg-purple-500/50 hover:dark:bg-purple-500/70",
                navigation: "rounded-full text-neutral-600 dark:text-neutral-200",
                glass: "rounded-full bg-neutral-300/70 text-neutral-600 backdrop-blur-md hover:bg-neutral-400/50 hover:text-black dark:bg-neutral-700/60 dark:text-neutral-200 hover:dark:bg-neutral-500/50 hover:dark:text-white",
                ghost: "rounded-full bg-transparent text-neutral-500 hover:text-neutral-950 focus-visible:text-neutral-950 dark:text-neutral-300 hover:dark:text-neutral-50 focus-visible:dark:text-neutral-50",
                pagination: "group focus-visible:scale-125",
                paginationActive: "focus-visible:scale-125",
                link: "font-semibold text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50",
                input: "bg-neutral-150 dark:bg-neutral-850 rounded-xl hover:bg-neutral-200 hover:dark:bg-neutral-800",
                destructive: "rounded-full bg-red-500/100 text-neutral-50 hover:bg-red-500/80 dark:bg-red-500/50 hover:dark:bg-red-500/70",
            },
            size: {
                default: "h-12 w-fit px-5 py-3",
                small: "h-9 px-4",
                icon: "h-12 min-h-12 w-12 min-w-12",
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

const Button = ({
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

export { Button, buttonVariants };
