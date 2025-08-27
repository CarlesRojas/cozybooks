import { cn } from "@/lib/cn";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import type { ComponentProps } from "react";

export const Avatar = ({ className, ref, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) => (
    <AvatarPrimitive.Root ref={ref} className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />
);

export const AvatarImage = ({ className, ref, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) => (
    <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
);

export const AvatarFallback = ({ className, ref, ...props }: ComponentProps<typeof AvatarPrimitive.Fallback>) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn("flex h-full w-full items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800", className)}
        {...props}
    />
);
