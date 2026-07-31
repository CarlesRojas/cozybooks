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
    wantToRead?: { userId: string };

    // Centres the section on desktop when its covers are too few to fill the row.
    // Off by default: the library pages stack several sections down the page, and
    // one centring itself while its neighbours stay left would break that column.
    centerIfShort?: boolean;

    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
}

// Slides are fixed-width — sized on phones so two covers fit with a sliver of the
// third peeking in. The first/last margins line the row up with the `px-6`
// gutter the rest of the page uses while letting the carousel bleed to the
// screen edge.
const itemClassName = cn(
    "basis-auto",
    "w-[44vw] max-w-[44vw] min-w-[44vw] sm:w-52 sm:max-w-52 sm:min-w-52 lg:w-56 lg:max-w-56 lg:min-w-56 xl:w-60 xl:max-w-60 xl:min-w-60",
    // The row is shifted -ml-4 by CarouselContent, which cancels the first slide's
    // pl-4 gap — so the first margin needs the full gutter width.
    "first:ml-6 last:mr-6",
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

const BookCarousel = ({
    title,
    books,
    isLoading,
    noBooksChildren,
    wantToRead,
    centerIfShort,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: Props) => {
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

    // Two books per slide, stacked vertically, so the list reads in column pairs:
    // 1 3 5 7
    // 2 4 6 8
    // Exception: exactly two books sit side by side in a single row instead.
    const columns: Array<Array<Book>> = [];
    if (books.length === 2) books.forEach((book) => columns.push([book]));
    else for (let index = 0; index < books.length; index += 2) columns.push(books.slice(index, index + 2));

    // Slide changes don't auto-reInit embla (`watchSlides: false`); reInit here
    // whenever the rendered slides change, preserving the scroll position.
    useEffect(() => {
        if (emblaApi) preserveEmblaPosition(emblaApi);
    }, [emblaApi, books.length, showSkeletons, hasNextPage]);

    // A row too short to scroll would otherwise sit against the left gutter with the
    // rest of a wide screen empty beside it. Asking embla whether it can scroll is
    // what makes this exact — the answer accounts for slide widths and the viewport,
    // so it holds at any breakpoint and for any number of books.
    const [fitsInView, setFitsInView] = useState(false);
    const isCentered = !!centerIfShort && fitsInView;

    useEffect(() => {
        if (!emblaApi) return;

        const update = () => setFitsInView(!emblaApi.canScrollPrev() && !emblaApi.canScrollNext());
        update();

        emblaApi.on("reInit", update);
        emblaApi.on("resize", update);
        emblaApi.on("select", update);

        return () => {
            emblaApi.off("reInit", update);
            emblaApi.off("resize", update);
            emblaApi.off("select", update);
        };
    }, [emblaApi]);

    return (
        <section className="flex h-fit w-full flex-col gap-4">
            {/* The heading follows the covers: centring one and not the other would
                leave the section reading as two pieces that disagree. */}
            {(books.length > 0 || !isLoading) &&
                (typeof title === "string" ? (
                    <h2
                        className={cn(
                            "w-full px-6 text-2xl leading-5 font-bold text-neutral-950/90 dark:text-neutral-50/90",
                            isCentered && "lg:text-center",
                        )}
                    >
                        {title}
                    </h2>
                ) : (
                    <div className={cn("w-full px-6", isCentered && "lg:flex lg:justify-center")}>{title}</div>
                ))}

            {!isLoading && books.length === 0 && <div className="w-full px-6">{!!noBooksChildren && noBooksChildren}</div>}

            {(books.length > 0 || showSkeletons) && (
                <div className="relative w-full overflow-hidden">
                    <Carousel
                        opts={{ align: "start", dragFree: true, slidesToScroll: "auto", containScroll: "keepSnaps", watchSlides: false }}
                        setApi={setEmblaApi}
                        className="w-full"
                    >
                        <CarouselPrevious className="mouse:inline-flex z-10 hidden" />

                        <CarouselContent className={cn("pt-1 pb-2", isCentered && "lg:justify-center")}>
                            {columns.map((column) => (
                                <CarouselItem key={column[0].id} className={itemClassName}>
                                    <div className="flex flex-col gap-4">
                                        {column.map((book) => (
                                            <BookCover key={book.id} book={book} linkToBook maxWidth={300} wantToRead={wantToRead} />
                                        ))}
                                    </div>
                                </CarouselItem>
                            ))}

                            {/* 12 columns of two covers each, so the row stays shimmering
                                past the edge of the widest screen while results load. */}
                            {showSkeletons &&
                                Array.from({ length: 12 }, (_, index) => (
                                    <CarouselItem key={`skeleton-${index}`} className={itemClassName}>
                                        <div className="flex flex-col gap-4">
                                            <div className="skeleton aspect-book w-full rounded-[22px]" />
                                            <div className="skeleton aspect-book w-full rounded-[22px]" />
                                        </div>
                                    </CarouselItem>
                                ))}

                            {books.length > 0 && hasNextPage && (
                                <CarouselItem key="load-more" className={itemClassName}>
                                    <div className="flex flex-col gap-4">
                                        <div ref={sentinelRef} className="skeleton aspect-book w-full rounded-[22px]" />
                                        <div className="skeleton aspect-book w-full rounded-[22px]" />
                                    </div>
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
