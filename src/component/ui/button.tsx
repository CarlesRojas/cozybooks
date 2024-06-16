import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/util";

const buttonVariants = cva(
    "focus-scale inline-flex items-center justify-center whitespace-nowrap rounded-full text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-purple-500 text-neutral-50",
                navigation: "dark:text-neutral-200 text-neutral-600",
                glass: "bg-neutral-300/70 backdrop-blur-md dark:bg-neutral-700/60 dark:text-neutral-200 text-neutral-600 mouse:hover:text-black mouse:hover:dark:text-white mouse:hover:bg-neutral-400/50 mouse:hover:dark:bg-neutral-500/50",
            },
            size: {
                default: "h-12 px-5 py-3",
                icon: "h-12 w-12",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
