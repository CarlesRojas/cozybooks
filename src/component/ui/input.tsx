import { Button } from "@/component/ui/button";
import { cn } from "@/util";
import { ReactNode, forwardRef } from "react";
import { LuX } from "react-icons/lu";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: ReactNode;
    onClear?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, icon, onClear, ...props }, ref) => {
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
                <Button size="ghost" variant="ghost" onClick={onClear}>
                    <LuX className="icon" />
                </Button>
            )}
        </div>
    );
});
Input.displayName = "Input";

export { Input };
