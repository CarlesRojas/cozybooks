import { cn } from "@/lib/cn";
import { Star as StarIcon } from "lucide-react";

interface StarProps {
    left: boolean;
    full: boolean;
    onClick?: (newRating: number) => void;
    onFocus?: (newRating: number) => void;
    rating: number;
    isLoading?: boolean;
    disabled?: boolean;
}

const Star = ({ left, full, onClick, onFocus, rating, isLoading, disabled }: StarProps) => {
    return (
        <button
            className={cn(
                "pointer-events-none relative h-8 w-4 overflow-hidden focus-visible:outline-none",
                onClick && "pointer-events-auto",
            )}
            onClick={() => onClick?.(rating)}
            onFocus={() => onFocus?.(rating)}
            disabled={!!isLoading || !!disabled}
            aria-label={`Rate this game with ${rating} stars`}
        >
            <StarIcon
                className={cn(
                    "absolute top-0 h-8 w-8 stroke-[1] p-1",
                    full
                        ? "fill-purple-500 stroke-purple-400 text-purple-500"
                        : "fill-neutral-200 stroke-neutral-300 text-neutral-200 dark:fill-neutral-600 dark:stroke-neutral-500 dark:text-neutral-600",
                    left ? "left-0" : "right-0",
                    !!isLoading &&
                        "animate-pulse fill-neutral-200 stroke-neutral-300 text-neutral-200 dark:fill-neutral-600 dark:stroke-neutral-500 dark:text-neutral-600",
                )}
            />
        </button>
    );
};

export default Star;
