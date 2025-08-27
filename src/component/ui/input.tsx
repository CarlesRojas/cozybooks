import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export interface InputProps extends ComponentProps<"input"> {
    icon?: ReactNode;
    onClear?: () => void;
}

export const Input = ({ className, type, icon, onClear, ref, ...props }: InputProps) => {
    return (
        <div className="bg-neutral-150 dark:bg-neutral-850 relative flex w-full items-center gap-3 rounded-xl px-3 sm:max-w-[30rem]">
            <label className={cn("group flex h-12 grow items-center gap-3 focus-within:outline-none", className)}>
                {icon}

                <input
                    type={type}
                    ref={ref}
                    className="g-full flex w-full bg-transparent text-[16px] font-medium !outline-none placeholder:text-neutral-500"
                    {...props}
                />
            </label>

            {onClear && (
                <Button type="button" size="ghost" variant="ghost" onClick={onClear}>
                    <X className="icon" />
                </Button>
            )}
        </div>
    );
};
