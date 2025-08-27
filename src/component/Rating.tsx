import { Button } from "@/component/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/component/ui/tooltip";
import { cn } from "@/lib/cn";
import { useCreateRating } from "@/server/old/use/rating/useCreateRating";
import { useDeleteRating } from "@/server/old/use/rating/useDeleteRating";
import { useRating } from "@/server/old/use/rating/useRating";
import { Book } from "@/type/Book";
import { LuStar, LuX } from "lucide-react";
import { MouseEvent, TouchEvent, useEffect, useRef, useState } from "react";

interface Props {
    book: Book;
    tooltipSide?: "top" | "right" | "bottom" | "left";
}

interface State {
    rating: number | null;
    interacting: boolean;
    delete: boolean;
}

const Rating = ({ book, tooltipSide = "top" }: Props) => {
    const currentRating = useRating({ bookId: book.id });
    const createRating = useCreateRating();
    const deleteRating = useDeleteRating();

    const containerRef = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<State>({ rating: null, interacting: false, delete: false });

    useEffect(() => {
        currentRating.data && setState((prev) => ({ ...prev, rating: currentRating.data }));
    }, [currentRating.data]);

    useEffect(() => {
        if (currentRating.isLoading) return;

        if (state.delete) {
            deleteRating.mutate({ bookId: book.id });
            setState((prev) => ({ ...prev, delete: false }));
            return;
        }

        if (state.interacting || state.rating === null || currentRating.data === state.rating) return;
        createRating.mutate({ bookId: book.id, rating: state.rating });

        const isMouse = window.matchMedia("(hover: hover)").matches;
        if (isMouse) setState((prev) => ({ ...prev, interacting: true }));
    }, [book.id, createRating, currentRating.data, currentRating.isLoading, state, deleteRating]);

    const calculateRating = (x: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return 0;
        const value = (x - rect.left) / rect.width;
        return Math.max(1, Math.ceil(Math.min(1, Math.max(0, value)) * 10));
    };

    const startInteracting = () => setState((prev) => ({ ...prev, interacting: true }));
    const finishInteracting = () => setState((prev) => ({ ...prev, interacting: false }));

    const onMouseMove = (event: MouseEvent<HTMLDivElement>) =>
        state.interacting && setState((prev) => ({ ...prev, rating: calculateRating(event.clientX) }));

    const onTouchMove = (event: TouchEvent<HTMLDivElement>) =>
        state.interacting && setState((prev) => ({ ...prev, rating: calculateRating(event.touches[0].clientX) }));

    const onFocus = (newRating: number) => setState({ interacting: true, rating: newRating, delete: false });
    const onBlur = () => setState({ interacting: false, rating: currentRating.data ?? null, delete: false });

    const onClick = (newRating: number) => {
        setState({ interacting: false, rating: newRating, delete: false });
    };

    const onDeleteClick = () => {
        setState({ interacting: false, rating: null, delete: true });
    };

    if (currentRating.isLoading)
        return (
            <div className="group relative flex w-fit items-center justify-center">
                <div className="relative flex w-fit cursor-grab touch-none items-center justify-center">
                    {Array.from({ length: 10 }, (_, i) => (
                        <Star key={i} left={i % 2 === 0} full={!!state.rating && i < state.rating} rating={i + 1} isLoading />
                    ))}
                </div>
            </div>
        );

    return (
        <TooltipProvider>
            <Tooltip open={state.interacting}>
                <div className="group relative flex w-fit items-center justify-center">
                    <TooltipTrigger asChild>
                        <div
                            ref={containerRef}
                            className="relative flex w-fit cursor-grab touch-none items-center justify-center"
                            onMouseEnter={startInteracting}
                            onTouchStart={startInteracting}
                            onMouseMove={onMouseMove}
                            onTouchMove={onTouchMove}
                            onMouseLeave={onBlur}
                            onTouchEnd={finishInteracting}
                            onBlur={onBlur}
                        >
                            {Array.from({ length: 10 }, (_, i) => (
                                <Star
                                    key={i}
                                    left={i % 2 === 0}
                                    full={!!state.rating && i < state.rating}
                                    onClick={onClick}
                                    onFocus={onFocus}
                                    rating={i + 1}
                                />
                            ))}
                        </div>
                    </TooltipTrigger>

                    {typeof currentRating.data === "number" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="pointer-events-none absolute right-0 h-[unset] min-h-[unset] w-[unset] min-w-[unset] translate-x-full p-0 opacity-0 opacity-70 transition-opacity focus-visible:opacity-100 group-focus-within:opacity-70 group-hover:pointer-events-auto group-hover:opacity-100"
                            onClick={onDeleteClick}
                        >
                            <LuX className={cn("h-10 h-8 w-10 w-9 stroke-[3] px-2 py-1")} />
                        </Button>
                    )}
                </div>

                <TooltipContent
                    className="flex min-h-11 min-h-9 min-w-11 min-w-9 flex-row items-center justify-center gap-2 transition-all"
                    sideOffset={8}
                    side={tooltipSide}
                >
                    <p className="text-base font-bold tracking-wide">{state.rating ?? 0}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

interface StarProps {
    left: boolean;
    full: boolean;
    onClick?: (newRating: number) => void;
    onFocus?: (newRating: number) => void;
    rating: number;
    isLoading?: boolean;
    disabled?: boolean;
}

export const Star = ({ left, full, onClick, onFocus, rating, isLoading, disabled }: StarProps) => {
    return (
        <button
            className={cn(
                "pointer-events-none relative h-10 h-8 w-4 w-5 overflow-hidden focus-visible:outline-none",
                onClick && "pointer-events-auto",
            )}
            onClick={() => onClick?.(rating)}
            onFocus={() => onFocus?.(rating)}
            disabled={!!isLoading || !!disabled}
            aria-label={`Rate this game with ${rating} stars`}
        >
            <LuStar
                className={cn(
                    "absolute top-0 h-10 h-8 w-10 w-8 stroke-[1] p-1",
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

export default Rating;
