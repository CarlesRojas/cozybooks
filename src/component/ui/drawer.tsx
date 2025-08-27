import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

export const Drawer = ({ shouldScaleBackground = true, ...props }: ComponentProps<typeof DrawerPrimitive.Root>) => (
    <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);

export const DrawerTrigger = DrawerPrimitive.Trigger;

export const DrawerPortal = DrawerPrimitive.Portal;

export const DrawerClose = DrawerPrimitive.Close;

export const DrawerOverlay = ({ className, ref, ...props }: ComponentProps<typeof DrawerPrimitive.Overlay>) => (
    <DrawerPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
);

export const DrawerContent = ({ className, children, ref, ...props }: ComponentProps<typeof DrawerPrimitive.Content>) => (
    <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
            ref={ref}
            className={cn(
                "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
                className,
            )}
            {...props}
        >
            <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-neutral-100 dark:bg-neutral-800" />
            {children}
        </DrawerPrimitive.Content>
    </DrawerPortal>
);

export const DrawerHeader = ({ className, ...props }: ComponentProps<"div">) => (
    <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
);

export const DrawerFooter = ({ className, ...props }: ComponentProps<"div">) => (
    <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);

export const DrawerTitle = ({ className, ref, ...props }: ComponentProps<typeof DrawerPrimitive.Title>) => (
    <DrawerPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
);

export const DrawerDescription = ({ className, ref, ...props }: ComponentProps<typeof DrawerPrimitive.Description>) => (
    <DrawerPrimitive.Description ref={ref} className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)} {...props} />
);
