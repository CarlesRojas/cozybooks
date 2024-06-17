import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/util";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
    "focus-scale inline-flex items-center justify-center whitespace-nowrap text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-30",
    {
        variants: {
            variant: {
                default: "bg-purple-500 text-neutral-50 rounded-full",
                navigation: "dark:text-neutral-200 text-neutral-600 rounded-full",
                glass: "bg-neutral-300/70 backdrop-blur-md rounded-full dark:bg-neutral-700/60 dark:text-neutral-200 text-neutral-600 mouse:hover:text-black mouse:hover:dark:text-white mouse:hover:bg-neutral-400/50 mouse:hover:dark:bg-neutral-500/50",
                ghost: "bg-transparent rounded-full text-neutral-500 mouse:focus-visible:text-neutral-950 mouse:focus-visible:dark:text-neutral-50 mouse:hover:text-neutral-950 mouse:hover:dark:text-neutral-50",
                pagination: "group mouse:focus-visible:scale-125",
                paginationActive: "mouse:focus-visible:scale-125",
            },
            size: {
                default: "h-12 px-5 py-3",
                icon: "h-12 w-12",
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
