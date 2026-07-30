import BookCover from "@/component/BookCover";
import type { CarouselApi } from "@/component/ui/carousel";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/component/ui/carousel";
import { cn } from "@/lib/cn";
import type { Book } from "@/type/Book";
import type { ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

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

// Slides are fixed-width — sized on phones so two covers fit with a sliver of the
// third peeking in. The first/last margins line the row up with the
// `max-w-screen-lg px-6` column the rest of the page uses while letting the
// carousel bleed to the screen edge.
const itemClassName = cn(
    "basis-auto",
    "w-[42vw] max-w-[42vw] min-w-[42vw] sm:w-48 sm:max-w-48 sm:min-w-48 lg:w-52 lg:max-w-52 lg:min-w-52 xl:w-56 xl:max-w-56 xl:min-w-56",
    // The row is shifted -ml-4 by CarouselContent, which cancels the first slide's
    // pl-4 gap — so the first margin needs the full gutter width.
    "first:ml-[max(1.5rem,calc(50vw-32rem+1.5rem))] last:mr-[max(1.5rem,calc(50vw-32rem+1.5rem))]",
);

// Embla's automatic reInit when slides are added snaps to the nearest snap point and
// kills any in-flight momentum, which reads as a jump when a new page loads. This is
// embla's official infinite-scroll recipe: reInit manually while carrying the engine's
// position and momentum over to the new instance.
const preserveEmblaPosition = (api: NonNullable<CarouselApi>) => {
    const oldEngine = api.internalEngine();
    api.reInit();
    const newEngine = api.internalEngine();

    const oldModules = oldEngine as unknown as Record<string, object | undefined>;
    const newModules = newEngine as unknown as Record<string, object | undefined>;
    ["location", "offsetLocation", "previousLocation", "target", "scrollBody"].forEach((module) => {
        const oldModule = oldModules[module];
        const newModule = newModules[module];
        if (oldModule && newModule) Object.assign(newModule, oldModule);
    });

    newEngine.translate.to(oldEngine.location.get());
    const { index } = newEngine.scrollTarget.byDistance(0, false);
    newEngine.index.set(index);
    newEngine.animation.start();
};

const BookCarousel = ({ title, books, isLoading, noBooksChildren, wantToRead, hasNextPage, isFetchingNextPage, onLoadMore }: Props) => {
    const [emblaApi, setEmblaApi] = useState<CarouselApi>();
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

    // Slide changes don't auto-reInit embla (`watchSlides: false`); reInit here
    // whenever the rendered slides change, preserving the scroll position.
    useEffect(() => {
        if (emblaApi) preserveEmblaPosition(emblaApi);
    }, [emblaApi, books.length, showSkeletons, hasNextPage]);

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
                    <Carousel
                        opts={{ align: "start", dragFree: true, slidesToScroll: "auto", containScroll: "keepSnaps", watchSlides: false }}
                        setApi={setEmblaApi}
                        className="w-full"
                    >
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
