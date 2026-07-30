import BookCover from "@/component/BookCover";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/component/ui/carousel";
import { cn } from "@/lib/cn";
import type { Book } from "@/type/Book";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useRef } from "react";

interface Props {
    title: string | ReactElement;
    books: Array<Book>;
    isLoading?: boolean;
    noBooksChildren?: ReactNode;
    wantToRead?: { userId: string; googleToken: string };

    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
}

// Slides are fixed-width; the first/last margins line the row up with the
// `max-w-screen-lg px-6` column the rest of the page uses while letting the
// carousel bleed to the screen edge.
const itemClassName = cn(
    "basis-auto",
    "w-36 max-w-36 min-w-36 lg:w-40 lg:max-w-40 lg:min-w-40 xl:w-44 xl:max-w-44 xl:min-w-44",
    "first:ml-[max(0.5rem,calc(50vw-32rem+0.5rem))] last:mr-[max(1.5rem,calc(50vw-32rem+1.5rem))]",
);

const BookCarousel = ({ title, books, isLoading, noBooksChildren, wantToRead, hasNextPage, isFetchingNextPage, onLoadMore }: Props) => {
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const loadMoreRef = useRef({ onLoadMore, hasNextPage, isFetchingNextPage });
    loadMoreRef.current = { onLoadMore, hasNextPage, isFetchingNextPage };

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const current = loadMoreRef.current;
                    if (entry.isIntersecting && current.hasNextPage && !current.isFetchingNextPage) current.onLoadMore?.();
                });
            },
            { rootMargin: "0px 400px" },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, books.length]);

    const showSkeletons = !!isLoading && books.length === 0;

    return (
        <section className="flex h-fit w-full flex-col gap-4">
            {(books.length > 0 || !isLoading) &&
                (typeof title === "string" ? (
                    <h2 className="mx-auto w-full max-w-screen-lg px-6 text-2xl leading-5 font-bold text-neutral-950/90 dark:text-neutral-50/90">
                        {title}
                    </h2>
                ) : (
                    <div className="mx-auto w-full max-w-screen-lg px-6">{title}</div>
                ))}

            {!isLoading && books.length === 0 && (
                <div className="mx-auto w-full max-w-screen-lg px-6">{!!noBooksChildren && noBooksChildren}</div>
            )}

            {(books.length > 0 || showSkeletons) && (
                <div className="relative w-full overflow-hidden">
                    <Carousel opts={{ align: "start", dragFree: true, slidesToScroll: "auto" }} className="w-full">
                        <CarouselPrevious className="mouse:inline-flex z-10 hidden" />

                        <CarouselContent className="pt-1 pb-2">
                            {books.map((book) => (
                                <CarouselItem key={book.id} className={itemClassName}>
                                    <BookCover book={book} linkToBook maxWidth={300} wantToRead={wantToRead} />
                                </CarouselItem>
                            ))}

                            {showSkeletons &&
                                Array.from({ length: 6 }, (_, index) => (
                                    <CarouselItem key={`skeleton-${index}`} className={itemClassName}>
                                        <div className="skeleton aspect-book w-full rounded-[22px]" />
                                    </CarouselItem>
                                ))}

                            {books.length > 0 && hasNextPage && (
                                <CarouselItem key="load-more" className={itemClassName}>
                                    <div ref={sentinelRef} className="skeleton aspect-book w-full rounded-[22px]" />
                                </CarouselItem>
                            )}
                        </CarouselContent>

                        <CarouselNext className="mouse:inline-flex z-10 hidden" />
                    </Carousel>
                </div>
            )}
        </section>
    );
};

export default BookCarousel;
