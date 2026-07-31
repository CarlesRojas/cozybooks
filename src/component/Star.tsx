import { cn } from "@/lib/cn";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface StarProps {
    left: boolean;
    full: boolean;
    onClick?: (newRating: number) => void;
    onFocus?: (newRating: number) => void;
    rating: number;
    isLoading?: boolean;
    disabled?: boolean;
}

// Ten halves make the row, so each one takes its colour from its own place along the
// brand gradient — the row reads as one horizontal sweep rather than ten repeats of
// it. Sampling a colour per half beats a real gradient here: each star is its own
// element, and a gradient inside one can only run across that element.
const STAR_COUNT = 10;
const gradientColour = (rating: number) => {
    const position = ((rating - 1) / (STAR_COUNT - 1)) * 100;
    return `color-mix(in oklab, var(--color-brand-warm) ${position}%, var(--color-brand))`;
};

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
            {/* The star is drawn by a filled path taking its colour from the text
                colour, so the fill and stroke utilities the outline icon needed are
                gone — a half star still comes from the button clipping this in two. */}
            <FontAwesomeIcon
                icon={faStar}
                className={cn(
                    "absolute top-0 h-8 w-8 p-1",
                    !full && "text-neutral-200 dark:text-neutral-600",
                    left ? "left-0" : "right-0",
                    !!isLoading && "animate-pulse text-neutral-200 dark:text-neutral-600",
                )}
                style={full && !isLoading ? { color: gradientColour(rating) } : undefined}
            />
        </button>
    );
};

export default Star;
