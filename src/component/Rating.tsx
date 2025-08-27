import Star from "@/component/Star";
import { Button } from "@/component/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/component/ui/tooltip";
import { cn } from "@/lib/cn";
import { useCreateRating } from "@/server/use/rating/useCreateRating";
import { useDeleteRating } from "@/server/use/rating/useDeleteRating";
import { useRating } from "@/server/use/rating/useRating";
import { Book } from "@/type/Book";
import { QueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { MouseEvent, TouchEvent, useEffect, useRef, useState } from "react";

interface Props {
    book: Book;
    tooltipSide?: "top" | "right" | "bottom" | "left";
    userId: string;
    queryClient: QueryClient;
}

interface State {
    rating: number | null;
    interacting: boolean;
    delete: boolean;
}

const Rating = ({ book, tooltipSide = "top", userId, queryClient }: Props) => {
    const currentRating = useRating({ bookId: book.id, userId });
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
            deleteRating.mutate({ bookId: book.id, userId, queryClient });
            setState((prev) => ({ ...prev, delete: false }));
            return;
        }

        if (state.interacting || state.rating === null || currentRating.data === state.rating) return;

        // Ensure rating is a valid number before calling createRating
        if (typeof state.rating === "number" && state.rating >= 1 && state.rating <= 10) {
            createRating.mutate({ bookId: book.id, rating: state.rating, userId, queryClient });
        }

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
                            className="pointer-events-none absolute right-0 h-[unset] min-h-[unset] w-[unset] min-w-[unset] translate-x-full p-0 opacity-70 transition-opacity group-focus-within:opacity-70 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:opacity-100"
                            onClick={onDeleteClick}
                        >
                            <X className={cn("h-8 w-9 stroke-[3] px-2 py-1")} />
                        </Button>
                    )}
                </div>

                <TooltipContent
                    className="flex min-h-9 min-w-9 flex-row items-center justify-center gap-2 transition-all"
                    sideOffset={8}
                    side={tooltipSide}
                >
                    <p className="text-base font-bold tracking-wide">{state.rating ?? 0}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default Rating;
