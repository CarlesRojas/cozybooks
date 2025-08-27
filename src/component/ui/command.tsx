import { Dialog, DialogContent } from "@/component/ui/dialog";
import { cn } from "@/lib/cn";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

export const Command = ({ className, ref, ...props }: ComponentProps<typeof CommandPrimitive>) => (
    <CommandPrimitive
        ref={ref}
        className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50",
            className,
        )}
        {...props}
    />
);

export const CommandDialog = ({ children, ...props }: ComponentProps<typeof Dialog>) => {
    return (
        <Dialog {...props}>
            <DialogContent className="overflow-hidden p-0 shadow-lg">
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-neutral-500 dark:[&_[cmdk-group-heading]]:text-neutral-400 [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    );
};

export const CommandInput = ({ className, ref, ...props }: ComponentProps<typeof CommandPrimitive.Input>) => (
    <div className="flex items-center border-b border-stone-300 px-3 dark:border-stone-700" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandPrimitive.Input
            ref={ref}
            className={cn(
                "flex h-11 w-full rounded-2xl bg-transparent py-3 text-sm font-medium outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-neutral-400",
                className,
            )}
            {...props}
        />
    </div>
);

export const CommandList = ({ className, ref, ...props }: ComponentProps<typeof CommandPrimitive.List>) => (
    <CommandPrimitive.List ref={ref} className={cn("max-h-[300px] overflow-x-hidden overflow-y-auto", className)} {...props} />
);

export const CommandEmpty = ({ ref, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) => (
    <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />
);

export const CommandGroup = ({ className, ref, ...props }: ComponentProps<typeof CommandPrimitive.Group>) => (
    <CommandPrimitive.Group
        ref={ref}
        className={cn(
            "overflow-hidden p-1 text-neutral-950 dark:text-neutral-50 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-neutral-500 dark:[&_[cmdk-group-heading]]:text-neutral-400",
            className,
        )}
        {...props}
    />
);

export const CommandSeparator = ({ className, ref, ...props }: ComponentProps<typeof CommandPrimitive.Separator>) => (
    <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-neutral-200 dark:bg-neutral-800", className)} {...props} />
);

export const CommandItem = ({ className, ref, ...props }: ComponentProps<typeof CommandPrimitive.Item>) => (
    <CommandPrimitive.Item
        ref={ref}
        className={cn(
            "text-md relative flex cursor-default items-center rounded-lg px-3 py-2 font-medium outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-neutral-100 data-[selected=true]:text-neutral-900 dark:data-[selected=true]:bg-neutral-800 dark:data-[selected=true]:text-neutral-50",
            className,
        )}
        {...props}
    />
);

export const CommandShortcut = ({ className, ...props }: ComponentProps<"span">) => {
    return <span className={cn("ml-auto text-xs tracking-widest text-neutral-500 dark:text-neutral-400", className)} {...props} />;
};
