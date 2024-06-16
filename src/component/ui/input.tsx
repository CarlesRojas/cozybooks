import { cn } from "@/util";
import { ReactNode, forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, icon, ...props }, ref) => {
    return (
        <label
            className={cn(
                "bg-neutral-150 dark:bg-neutral-850 group flex h-12 w-full items-center gap-3 rounded-xl px-3 focus-within:outline-none",
                className,
            )}
        >
            {icon}

            <input
                type={type}
                ref={ref}
                className="g-full flex w-full bg-transparent text-[16px] font-medium !outline-none placeholder:text-neutral-500"
                {...props}
            />
        </label>
    );
});
Input.displayName = "Input";

export { Input };