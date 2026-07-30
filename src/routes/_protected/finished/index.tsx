import BookCarousel from "@/component/BookCarousel";
import { Sort } from "@/component/SortMenu";
import Star from "@/component/Star";
import Stats from "@/component/Stats";
import { Button } from "@/component/ui/button";
import { cn } from "@/lib/cn";
import { useLibraryBooks } from "@/convex/use/useLibraryBooks";
import type { Book } from "@/type/Book";
import { LibraryType } from "@/type/Library";
import { createFileRoute } from "@tanstack/react-router";
import { Loader, Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { isIOS } from "react-device-detect";

export const Route = createFileRoute("/_protected/finished/")({
    component: RouteComponent,
});

interface Group {
    key: string;
    books: Array<Book>;
}

function RouteComponent() {
    const context = Route.useRouteContext();
    const { sort } = Route.useSearch();

    const [showRepeats, setShowRepeats] = useState(false);

    const finishedBooks = useLibraryBooks({ userId: context.user!.id, type: LibraryType.FINISHED });

    const sortedBooks = useMemo(
        () =>
            finishedBooks.data?.items.sort((a, b) => {
                if (sort === Sort.BOOK) return a.title.localeCompare(b.title);
                else if (sort === Sort.DATE) {
                    const aFinishedDate = a.finished?.sort((newA, newB) => newA.timestamp.getTime() - newB.timestamp.getTime())[0]
                        .timestamp;
                    const bFinishedDate = b.finished?.sort((newA, newB) => newA.timestamp.getTime() - newB.timestamp.getTime())[0]
                        .timestamp;
                    if (!aFinishedDate) return 1;
                    if (!bFinishedDate) return -1;
                    return bFinishedDate.getTime() - aFinishedDate.getTime();
                } else {
                    const aRating = a.rating && a.rating.length > 0 ? a.rating[0].rating : null;
                    const bRating = b.rating && b.rating.length > 0 ? b.rating[0].rating : null;
                    if (!aRating) return 1;
                    if (!bRating) return -1;
                    return bRating - aRating;
                }
            }),
        [sort, finishedBooks.data],
    );

    const groups: Array<Group> = useMemo(() => {
        if (!sortedBooks) return [];

        const result: Array<Group> = [];
        const addToGroup = (key: string, book: Book) => {
            const keyIndex = result.findIndex((group) => group.key === key);

            if (keyIndex === -1) result.push({ key, books: [book] });
            else if (!result[keyIndex].books.some((existing) => existing.id === book.id)) result[keyIndex].books.push(book);
        };

        sortedBooks.forEach((book) => {
            // With repeats on, a book shows in every year it was finished (once per
            // year); otherwise only in the year of its first read.
            if (sort === Sort.DATE && showRepeats && book.finished && book.finished.length > 0) {
                book.finished.forEach((finished) => addToGroup(finished.timestamp.toLocaleDateString("en", { year: "numeric" }), book));
                return;
            }

            const keyMap: Record<Sort, string> = {
                [Sort.BOOK]: book.title.length > 0 && /^[a-zA-Z]/.test(book.title[0]) ? book.title[0].toUpperCase() : "#",
                [Sort.DATE]:
                    book.finished
                        ?.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0]
                        .timestamp.toLocaleDateString("en", { year: "numeric" }) ?? "Unknown",
                [Sort.RATING]: (book.rating?.[0]?.rating ?? "Unrated").toString(),
            };

            addToGroup(keyMap[sort], book);
        });

        if (sort === Sort.DATE)
            result.sort((a, b) => (b.key === "Unknown" ? -1 : a.key === "Unknown" ? 1 : parseInt(b.key) - parseInt(a.key)));

        return result;
    }, [sort, sortedBooks, showRepeats]);

    const ratingTitle = (rating: number) => (
        <div className="relative flex w-fit items-center justify-center">
            {Array.from({ length: 10 }, (_, i) => (
                <Star key={i} left={i % 2 === 0} full={i < rating} rating={i + 1} disabled />
            ))}
        </div>
    );

    return (
        <main
            suppressHydrationWarning
            className={cn("relative mb-20 flex h-fit min-h-[calc(100vh_-_5rem)] w-full flex-col gap-5 pb-12", isIOS && "mb-24")}
        >
            {finishedBooks.isLoading && (
                <div className="flex w-full grow items-center justify-center px-6 transition-all">
                    <Loader className="size-8 min-h-8 min-w-8 animate-spin stroke-[3] opacity-50 duration-2000" />
                </div>
            )}

            <div className="flex h-fit w-full grow flex-col gap-6 py-4">
                {finishedBooks.data && <Stats books={finishedBooks.data.items} />}

                {finishedBooks.data && sort === Sort.DATE && (
                    <div className="mx-auto flex w-full max-w-screen-lg px-6">
                        <Button variant="glass" size="small" onClick={() => setShowRepeats(!showRepeats)}>
                            <Repeat className="icon mr-2" />

                            <p className="text-sm font-bold tracking-wide">{showRepeats ? "Hide repeat reads" : "Show repeat reads"}</p>
                        </Button>
                    </div>
                )}

                {groups.map(({ key, books }) => (
                    <BookCarousel
                        key={key}
                        title={sort === Sort.RATING ? (key === "Unrated" ? key : ratingTitle(parseInt(key))) : key}
                        books={books}
                    />
                ))}
            </div>
        </main>
    );
}
